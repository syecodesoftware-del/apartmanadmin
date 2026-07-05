'use client';

import { useActionState } from 'react';
import { updateBillingSettings } from '@/app/actions/billing';
import type { ActionState } from '@/app/actions/sites';
import type { BillingSettings } from '@/lib/data/overview';

const empty: ActionState = {};

export function BillingSettingsForm({ settings }: { settings: BillingSettings }) {
  const [state, action, pending] = useActionState(updateBillingSettings, empty);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Varsayılan Deneme Süresi (gün)">
        <input name="trialDays" type="number" min={0} defaultValue={settings.default_trial_days} className="input" />
      </Field>
      <Field label="Varsayılan Birim Fiyat (daire başı ₺)">
        <input name="unitPrice" type="text" inputMode="decimal" defaultValue={settings.default_unit_price} className="input" />
      </Field>
      <Field label="Para Birimi">
        <input name="currency" type="text" defaultValue={settings.currency} className="input" />
      </Field>
      <Field label="Faturalama Periyodu">
        <select name="period" defaultValue={settings.billing_period} className="input">
          <option value="monthly">Aylık</option>
          <option value="yearly">Yıllık</option>
        </select>
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? 'Kaydediliyor…' : 'Ayarları Kaydet'}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.message && <span className="text-sm text-emerald-600">{state.message}</span>}
      </div>

      <style>{`.input{width:100%;border:1px solid rgb(203 213 225);border-radius:0.5rem;padding:0.5rem 0.625rem;font-size:0.875rem}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
