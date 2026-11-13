import { useEffect, useRef } from 'react';

export interface ConfirmRequest {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly tone?: 'primary' | 'danger';
  readonly onConfirm: () => void;
}

export function ConfirmDialog({
  request,
  onCancel,
}: {
  readonly request: ConfirmRequest | null;
  readonly onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (request) confirmRef.current?.focus();
  }, [request]);

  useEffect(() => {
    if (!request) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request, onCancel]);

  if (!request) return null;
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{request.title}</h2>
        <p>{request.body}</p>
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            ref={confirmRef}
            className="button"
            data-tone={request.tone ?? 'primary'}
            onClick={() => {
              request.onConfirm();
              onCancel();
            }}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
