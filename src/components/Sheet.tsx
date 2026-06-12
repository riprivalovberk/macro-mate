import type { ReactNode } from 'react';

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet modal. Tapping the backdrop closes it. */
export function Sheet({ onClose, children }: SheetProps) {
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-grab" />
        {children}
      </div>
    </div>
  );
}
