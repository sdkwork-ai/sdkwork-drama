import { useEffect, useRef, useState } from 'react';

export interface BottomSheetOption {
  readonly id: string;
  readonly label: string;
}

export function BottomSheetPicker({
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  readonly title: string;
  readonly options: readonly BottomSheetOption[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sheetRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={sheetRef}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        <div className="sheet-options">
          {options.map((option) => {
            const selected = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                className="sheet-option"
                data-selected={selected ? 'true' : 'false'}
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
              >
                <span>{option.label}</span>
                {selected ? <span aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
        <button type="button" className="sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function usePickerState(): {
  readonly open: boolean;
  readonly show: () => void;
  readonly hide: () => void;
} {
  const [open, setOpen] = useState(false);
  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
  };
}
