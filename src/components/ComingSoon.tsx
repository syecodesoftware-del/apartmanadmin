import { PageHeader, Card } from '@/components/ui';

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <p className="py-8 text-center text-sm text-slate-400">
          Bu bölüm {phase} fazında geliyor.
        </p>
      </Card>
    </div>
  );
}
