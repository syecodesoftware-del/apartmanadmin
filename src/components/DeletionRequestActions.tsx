'use client';

import { useActionState } from 'react';
import { approveSiteDeletion, rejectSiteDeletion, type ActionState } from '@/app/actions/sites';

const empty: ActionState = {};

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-1 text-xs text-red-600">{state.error}</p>;
  if (state.message) return <p className="mt-1 text-xs text-emerald-600">{state.message}</p>;
  return null;
}

export function DeletionRequestActions({ requestId, siteName }: { requestId: string; siteName: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveSiteDeletion, empty);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectSiteDeletion, empty);

  return (
    <div className="space-y-2">
      <form
        action={approveAction}
        onSubmit={(e) => {
          if (!window.confirm(`"${siteName}" pasife alınacak (arşivlenecek) ve yönetici erişimi kapanacak. Onaylıyor musunuz?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="requestId" value={requestId} />
        <input name="note" placeholder="Not (opsiyonel)" className="mb-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <div className="flex gap-2">
          <button disabled={approvePending} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {approvePending ? '…' : 'Onayla → Pasife Al'}
          </button>
        </div>
        <Feedback state={approveState} />
      </form>

      <form action={rejectAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <button disabled={rejectPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          {rejectPending ? '…' : 'Reddet'}
        </button>
        <Feedback state={rejectState} />
      </form>
    </div>
  );
}
