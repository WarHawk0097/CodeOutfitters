import { authHandlers } from "./auth";
import { leadsHandlers } from "./leads";
import { meetingsHandlers } from "./meetings";
import { aiAndCrmHandlers } from "./ai-and-crm";
import { proposalsHandlers } from "./proposals";
import { clientHandlers } from "./client";

export const handlers = [
  ...authHandlers,
  ...leadsHandlers,
  ...meetingsHandlers,
  ...aiAndCrmHandlers,
  ...proposalsHandlers,
  ...clientHandlers,
];
