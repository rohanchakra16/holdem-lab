import { ReactNode } from 'react';

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-ivory-100">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-sand-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
