// A small Postgres stand-in behind the supabase-js query builder.
//
// It exists so `SupabaseConversationStore` can be tested for what it is
// responsible for — which statements it issues, how rows map to domain records,
// how a driver failure is turned into a typed error — without a database, and
// without the tests degenerating into "the store called .eq() twice".
//
// So this is not a spy. It holds real rows, applies the filters it is given, keeps
// the pieces the migration makes the database responsible for (a primary key that
// rejects a duplicate, an identity column that orders inserts, a policy that hides
// another user's rows, a trigger that touches the parent) and answers with the
// SQLSTATEs Postgres would answer with. What it deliberately does NOT do is prove
// those rules are actually declared in SQL — that is what the *.pglite.test.ts
// suite does, against the migration file itself, driven as a real `authenticated`
// role. The two halves are separate on purpose: a fake that also defined the
// policies would be able to agree with a store that was wrong.

/** The visibility the row-level security policies would enforce. */
export type FakeIdentity = { workspaceId: string; userId: string };

type Row = Record<string, unknown>;

/** The subset of the driver's error shape the store reads. */
export type FakeError = { code: string; message: string };

const UNIQUE_VIOLATION = "23505";
const RLS_VIOLATION = "42501";

type Result = { data: unknown; error: FakeError | null };

export class FakeSupabase {
  readonly conversations: Row[] = [];
  readonly messages: Row[] = [];
  /** Every table a statement touched, in order. Lets a test assert round trips. */
  readonly calls: string[] = [];
  /** Set to make the next statement against `table` fail like a driver would. */
  failures = new Map<string, FakeError>();

  private nextSeq = 1;

  constructor(private identity: FakeIdentity) {}

  /** Signs the connection in as somebody else, as `set role` would. */
  signIn(identity: FakeIdentity): void {
    this.identity = identity;
  }

  /** The next statement against `table` fails; every later one succeeds. */
  failNext(table: string, error: FakeError): void {
    this.failures.set(table, error);
  }

  /** Inserts a conversation belonging to somebody else, bypassing the policies —
   *  the equivalent of a fixture written as the table owner. */
  seedConversation(row: Row): void {
    this.conversations.push({ ...row });
  }

  private takeFailure(table: string): FakeError | null {
    const error = this.failures.get(table) ?? null;
    if (error) this.failures.delete(table);
    return error;
  }

  /** Whether the conversation is one the signed-in identity may reach at all. */
  private visible(row: Row): boolean {
    return row.user_id === this.identity.userId && row.workspace_id === this.identity.workspaceId;
  }

  private rowsOf(table: string): Row[] {
    if (table === "ai_conversations") return this.conversations.filter((row) => this.visible(row));
    if (table === "ai_messages") {
      const reachable = new Set(
        this.conversations.filter((row) => this.visible(row)).map((row) => row.id),
      );
      return this.messages.filter((row) => reachable.has(row.conversation_id));
    }
    return [];
  }

  private insert(table: string, row: Row): Result {
    const failure = this.takeFailure(table);
    if (failure) return { data: null, error: failure };

    if (table === "ai_conversations") {
      if (this.conversations.some((existing) => existing.id === row.id)) {
        return { data: null, error: { code: UNIQUE_VIOLATION, message: "duplicate key" } };
      }
      // WITH CHECK: the owner and the workspace are the session's, not the body's.
      if (!this.visible(row)) {
        return { data: null, error: { code: RLS_VIOLATION, message: "row-level security" } };
      }
      this.conversations.push({ ...row });
      return { data: null, error: null };
    }

    if (table === "ai_messages") {
      const parent = this.conversations.find((c) => c.id === row.conversation_id);
      // Missing and not-yours are one answer, exactly as `can_use_ai_conversation`
      // makes them one answer.
      if (!parent || !this.visible(parent)) {
        return { data: null, error: { code: RLS_VIOLATION, message: "row-level security" } };
      }
      if (this.messages.some((existing) => existing.id === row.id)) {
        return { data: null, error: { code: UNIQUE_VIOLATION, message: "duplicate key" } };
      }
      this.messages.push({ ...row, seq: this.nextSeq });
      this.nextSeq += 1;
      // The touch trigger. Real Postgres writes now(); the fake writes the message's
      // own timestamp so recency ordering is deterministic in a test.
      parent.updated_at = row.created_at;
      return { data: null, error: null };
    }

    return { data: null, error: { code: "42P01", message: "no such table" } };
  }

  from(table: string): FakeQuery {
    this.calls.push(table);
    return new FakeQuery(
      table,
      () => this.rowsOf(table),
      (row) => this.insert(table, row),
      () => this.takeFailure(table),
      (ids) => {
        for (const id of ids) {
          const index = this.conversations.findIndex((row) => row.id === id);
          if (index >= 0) this.conversations.splice(index, 1);
        }
        // Cascade.
        for (let i = this.messages.length - 1; i >= 0; i -= 1) {
          if (ids.includes(this.messages[i]!.conversation_id as string)) this.messages.splice(i, 1);
        }
      },
    );
  }
}

type Filter = (row: Row) => boolean;

/** One statement under construction. Awaiting it runs it. */
class FakeQuery implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private sort: { column: string; ascending: boolean } | null = null;
  private max: number | null = null;
  private mode: "select" | "insert" | "delete" = "select";
  private pending: Result | null = null;
  private single = false;

  constructor(
    readonly table: string,
    private readonly read: () => Row[],
    private readonly write: (row: Row) => Result,
    private readonly failure: () => FakeError | null,
    private readonly remove: (ids: string[]) => void,
  ) {}

  select(_columns?: string): this {
    this.mode = this.mode === "insert" ? "insert" : "select";
    return this;
  }

  insert(row: Row): this {
    this.mode = "insert";
    this.pending = this.write(row);
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: readonly unknown[]): this {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.sort = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number): this {
    this.max = count;
    return this;
  }

  maybeSingle(): this {
    this.single = true;
    return this;
  }

  private rows(): Row[] {
    let rows = this.read().filter((row) => this.filters.every((keep) => keep(row)));
    if (this.sort) {
      const { column, ascending } = this.sort;
      rows = [...rows].sort((a, b) => {
        const left = a[column] as string | number;
        const right = b[column] as string | number;
        const order = left < right ? -1 : left > right ? 1 : 0;
        return ascending ? order : -order;
      });
    }
    if (this.max !== null) rows = rows.slice(0, this.max);
    return rows.map((row) => ({ ...row }));
  }

  private run(): Result {
    if (this.mode === "insert") return this.pending ?? { data: null, error: null };
    const failure = this.failure();
    if (failure) return { data: null, error: failure };
    if (this.mode === "delete") {
      const doomed = this.rows().map((row) => row.id as string);
      this.remove(doomed);
      return { data: null, error: null };
    }
    const rows = this.rows();
    return this.single ? { data: rows[0] ?? null, error: null } : { data: rows, error: null };
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}
