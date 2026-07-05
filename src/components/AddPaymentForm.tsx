'use client';

import { useActionState } from 'react';
import { addSubscriptionPayment } from '@/app/actions/billing';
import type { ActionState } from '@/app/actions/sites';

const empty: ActionState = {};

export function AddPaymentForm({ siteId }: { siteId: string }) {
  const [state, action, pending] = useActionState(addSubscriptionPayment, empty);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
      <input type="hidden" name="siteId" value={siteId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Tutar (₺)</label>
        <input name="amount" type="text" inputMode="decimal" required className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Durum</label>
        <select name="status" defaultValue="paid" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
          <option value="paid">Ödendi</option>
          <option value="pending">Beklemede</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Dönem başı</label>
        <input name="periodStart" type="date" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Dönem sonu</label>
        <input name="periodEnd" type="date" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <button disabled={pending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {pending ? '…' : 'Ödeme Ekle'}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      {state.message && <p className="w-full text-xs text-emerald-600">{state.message}</p>}
    </form>
  );
}
