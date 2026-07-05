'use client';

import { useActionState } from 'react';
import { updateSubscriptionStatus, extendTrial, setUnitPrice, type ActionState } from '@/app/actions/sites';
import { STATUS_LABEL } from '@/lib/format';

const STATUSES = ['trial', 'active', 'past_due', 'suspended', 'cancelled'];
const empty: ActionState = {};

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-1 text-xs text-red-600">{state.error}</p>;
  if (state.message) return <p className="mt-1 text-xs text-emerald-600">{state.message}</p>;
  return null;
}

export function SiteSubscriptionControls({
  siteId,
  status,
  unitPrice,
  effectivePrice,
}: {
  siteId: string;
  status: string;
  unitPrice: number | null;
  effectivePrice: number;
}) {
  const [statusState, statusAction, statusPending] = useActionState(updateSubscriptionStatus, empty);
  const [trialState, trialAction, trialPending] = useActionState(extendTrial, empty);
  const [priceState, priceAction, pricePending] = useActionState(setUnitPrice, empty);

  return (
    <div className="space-y-4">
      <form action={statusAction}>
        <input type="hidden" name="siteId" value={siteId} />
        <label className="mb-1 block text-xs font-medium text-slate-500">Abonelik Durumu</label>
        <div className="flex gap-2">
          <select name="status" defaultValue={status} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
            ))}
          </select>
          <button disabled={statusPending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {statusPending ? '…' : 'Uygula'}
          </button>
        </div>
        <Feedback state={statusState} />
      </form>

      <form action={trialAction}>
        <input type="hidden" name="siteId" value={siteId} />
        <label className="mb-1 block text-xs font-medium text-slate-500">Deneme Süresini Uzat (gün)</label>
        <div className="flex gap-2">
          <input name="days" type="number" min={1} defaultValue={30} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          <button disabled={trialPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {trialPending ? '…' : 'Uzat'}
          </button>
        </div>
        <Feedback state={trialState} />
      </form>

      <form action={priceAction}>
        <input type="hidden" name="siteId" value={siteId} />
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Birim Fiyat (boş = platform varsayılanı, şu an {effectivePrice} ₺)
        </label>
        <div className="flex gap-2">
          <input
            name="price"
            type="text"
            inputMode="decimal"
            defaultValue={unitPrice ?? ''}
            placeholder={`${effectivePrice}`}
            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button disabled={pricePending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {pricePending ? '…' : 'Kaydet'}
          </button>
        </div>
        <Feedback state={priceState} />
      </form>
    </div>
  );
}
