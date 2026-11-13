export function EmptyState({
  title,
  hint,
  action,
}: {
  readonly title: string;
  readonly hint: string;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true">◫</span>
      <strong>{title}</strong>
      <p>{hint}</p>
      {action ? (
        <button type="button" className="button" data-tone="primary" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
