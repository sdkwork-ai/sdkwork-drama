export function NavBar({
  title,
  onBack,
  action,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}) {
  return (
    <header className="navbar">
      <button type="button" className="navbar-back" onClick={onBack} aria-label="Back">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1>{title}</h1>
      {action ? (
        <button type="button" className="navbar-action" onClick={action.onClick}>
          {action.label}
        </button>
      ) : (
        <span className="navbar-spacer" />
      )}
    </header>
  );
}
