'use client';

import { useActionState } from 'react';
import { deleteContent } from '@/app/actions/content';
import type { ActionState } from '@/app/actions/sites';

const empty: ActionState = {};

export function DeleteContentButton({ table, id }: { table: string; id: string }) {
  const [state, action, pending] = useActionState(deleteContent, empty);
  return (
    <form
      action={action}
      onSubmit={(e) => { if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) e.preventDefault(); }}
    >
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
        {pending ? '…' : state.error ? 'Hata' : 'Sil'}
      </button>
    </form>
  );
}
