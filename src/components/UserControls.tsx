'use client';

import { useActionState } from 'react';
import { setUserRole, setUserApproval, toggleUserActive, generateRecoveryLink, deleteUser } from '@/app/actions/users';
import type { ActionState } from '@/app/actions/sites';

const empty: ActionState = {};

function Msg({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-1 text-xs text-red-600">{state.error}</p>;
  if (state.message) return <p className="mt-1 break-all text-xs text-emerald-600">{state.message}</p>;
  return null;
}

export function UserControls({
  userId,
  email,
  role,
  approval,
  isActive,
  isSelf,
}: {
  userId: string;
  email: string;
  role: string;
  approval: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(setUserRole, empty);
  const [apprState, apprAction, apprPending] = useActionState(setUserApproval, empty);
  const [actState, actAction, actPending] = useActionState(toggleUserActive, empty);
  const [recState, recAction, recPending] = useActionState(generateRecoveryLink, empty);
  const [delState, delAction, delPending] = useActionState(deleteUser, empty);

  return (
    <div className="space-y-4">
      <form action={roleAction}>
        <input type="hidden" name="userId" value={userId} />
        <label className="mb-1 block text-xs font-medium text-slate-500">Rol</label>
        <div className="flex gap-2">
          <select name="role" defaultValue={role} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="resident">Sakin</option>
            <option value="manager">Yönetici</option>
            <option value="accountant">Muhasebeci</option>
            <option value="auditor">Denetçi</option>
            <option value="admin">Admin</option>
          </select>
          <button disabled={rolePending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Uygula</button>
        </div>
        <Msg state={roleState} />
      </form>

      <form action={apprAction}>
        <input type="hidden" name="userId" value={userId} />
        <label className="mb-1 block text-xs font-medium text-slate-500">Onay Durumu</label>
        <div className="flex gap-2">
          <select name="approval" defaultValue={approval} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="pending">Bekliyor</option>
            <option value="approved">Onaylı</option>
            <option value="rejected">Reddedildi</option>
          </select>
          <button disabled={apprPending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Uygula</button>
        </div>
        <Msg state={apprState} />
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={actAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value={(!isActive).toString()} />
          <button disabled={actPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {isActive ? 'Pasifleştir' : 'Aktifleştir'}
          </button>
        </form>

        <form action={recAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="email" value={email} />
          <button disabled={recPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Şifre Sıfırlama Bağlantısı
          </button>
        </form>
      </div>
      <Msg state={actState} />
      <Msg state={recState} />

      {!isSelf && (
        <form
          action={delAction}
          onSubmit={(e) => {
            if (!confirm('Bu hesabı KALICI olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) e.preventDefault();
          }}
          className="border-t border-slate-100 pt-4"
        >
          <input type="hidden" name="userId" value={userId} />
          <button disabled={delPending} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
            {delPending ? 'Siliniyor…' : 'Hesabı Kalıcı Sil'}
          </button>
          <Msg state={delState} />
        </form>
      )}
    </div>
  );
}
