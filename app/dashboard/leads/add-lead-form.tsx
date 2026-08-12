"use client";

// Manual lead creation — live mode only (POST /api/leads, app/api/leads/route.ts,
// gated the same way as the GET beside it: 404 in demo mode). Same inline-panel shape as
// [leadId]/lead-update-controls.tsx: a toggle button and a plain card, no modal library.
import { useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, ROW_ACTION_PRIMARY } from "@/lib/command-center/ui/control-system";
import { TextAreaField, TextField } from "@/components/demo/field";

type FieldErrors = Record<string, string>;

export function AddLeadForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceInterest, setServiceInterest] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function reset() {
    setFirstName("");
    setLastName("");
    setBusinessName("");
    setWorkEmail("");
    setPhone("");
    setServiceInterest("");
    setNotes("");
    setError("");
    setFieldErrors({});
  }

  async function save() {
    setSaving(true);
    setError("");
    setFieldErrors({});
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName: lastName || undefined,
        businessName,
        workEmail,
        phone: phone || undefined,
        serviceInterest: serviceInterest || undefined,
        notes: notes || undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      if (res.status === 422) {
        setFieldErrors({
          firstName: firstName.trim() ? "" : "First name is required.",
          businessName: businessName.trim() ? "" : "Business name is required.",
          workEmail: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(workEmail) ? "" : "A valid email is required.",
        });
      }
      setError(body?.error?.message ?? "That lead could not be created.");
      return;
    }
    reset();
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button type="button" className={BTN_PRIMARY} onClick={() => setOpen(true)}>
        + Add Lead
      </button>
    );
  }

  return (
    <div className="mb-3 rounded-cc-card border border-cc-line bg-cc-surface p-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-cc-t3">Add lead</h2>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <TextField label="First name" value={firstName} onChange={setFirstName} required error={fieldErrors.firstName || undefined} />
        <TextField label="Last name" value={lastName} onChange={setLastName} />
        <TextField label="Business name" value={businessName} onChange={setBusinessName} required error={fieldErrors.businessName || undefined} />
        <TextField label="Work email" type="email" value={workEmail} onChange={setWorkEmail} required error={fieldErrors.workEmail || undefined} />
        <TextField label="Phone" value={phone} onChange={setPhone} />
        <TextField label="Service interest" value={serviceInterest} onChange={setServiceInterest} />
      </div>
      <TextAreaField label="Notes" value={notes} onChange={setNotes} />
      {error ? <p className="mb-3 text-[11px] font-semibold text-cc-red-ink" role="alert">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          className={ROW_ACTION_PRIMARY}
          disabled={saving || !firstName.trim() || !businessName.trim() || !workEmail.trim()}
          onClick={save}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={BTN_SECONDARY}
          disabled={saving}
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
