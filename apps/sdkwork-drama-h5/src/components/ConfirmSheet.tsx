export interface ConfirmRequest {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly tone?: 'primary' | 'danger';
  readonly onConfirm: () => void;
}

export function ConfirmSheet({
  request,
  onCancel,
}: {
  readonly request: ConfirmRequest | null;
  readonly onCancel: () => void;
}) {
  if (!request) return null;
  return (
    <div className="sheet-overlay" role="presentation" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={request.title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{request.title}</h2>
        <p>{request.body}</p>
        <button
          type="button"
          className="sheet-primary"
          data-tone={request.tone ?? 'primary'}
          onClick={() => {
            request.onConfirm();
            onCancel();
          }}
        >
          {request.confirmLabel}
        </button>
        <button type="button" className="sheet-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
