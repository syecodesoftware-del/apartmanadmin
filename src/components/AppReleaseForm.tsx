'use client';

import { useActionState } from 'react';
import { updateAppRelease } from '@/app/actions/appRelease';
import type { ActionState } from '@/app/actions/sites';

const empty: ActionState = {};

export interface AppReleaseRow {
  platform: string;
  min_supported_version: string;
  latest_version: string;
  store_url: string;
  force_message: string;
  soft_message: string;
  updated_at: string;
}

export function AppReleaseForm({ row }: { row: AppReleaseRow }) {
  const [state, action, pending] = useActionState(updateAppRelease, empty);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="platform" value={row.platform} />

      <Field label="Zorunlu (min) sürüm — bunun altı bloklanır">
        <input name="minVersion" type="text" defaultValue={row.min_supported_version} placeholder="1.0.0" className="input" />
      </Field>
      <Field label="Güncel sürüm — altındakilere öneri gösterilir">
        <input name="latestVersion" type="text" defaultValue={row.latest_version} placeholder="1.0.0" className="input" />
      </Field>
      <Field label="Mağaza bağlantısı">
        <input name="storeUrl" type="text" defaultValue={row.store_url} placeholder="https://…" className="input sm:col-span-2" />
      </Field>
      <Field label="Zorunlu güncelleme mesajı">
        <input name="forceMessage" type="text" defaultValue={row.force_message} className="input" />
      </Field>
      <Field label="Opsiyonel öneri mesajı">
        <input name="softMessage" type="text" defaultValue={row.soft_message} className="input" />
      </Field>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.message && <span className="text-sm text-emerald-600">{state.message}</span>}
        <span className="ml-auto text-xs text-slate-400">
          Son güncelleme: {new Date(row.updated_at).toLocaleString('tr-TR')}
        </span>
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
