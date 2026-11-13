import type { UseIamAccount } from '../account/use-iam-account';
import { copy } from '../i18n';

export function AccountScreen({ account }: { readonly account: UseIamAccount }) {
  const snapshot = account.snapshot;
  const profile = snapshot.status === 'authenticated' ? snapshot.profile : null;
  const displayName = profile?.displayName?.trim() || profile?.email?.trim() || 'Signed in user';

  return (
    <div className="screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">{copy.app.tagline}</p>
          <h1>{copy.account.title}</h1>
        </div>
      </header>

      <section className="surface profile-card">
        <span className="profile-avatar" aria-hidden="true">
          {displayName.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <strong>{displayName}</strong>
          <p>{profile?.email ?? profile?.phone ?? 'Profile projection unavailable'}</p>
        </div>
      </section>

      <section className="surface">
        <dl className="fact-list">
          <div><dt>{copy.account.tenant}</dt><dd><code>{profile?.tenantId ?? '—'}</code></dd></div>
          <div><dt>{copy.account.organization}</dt><dd><code>{profile?.organizationId ?? '—'}</code></dd></div>
          <div><dt>{copy.account.session}</dt><dd><code>{profile?.sessionId ?? '—'}</code></dd></div>
          <div><dt>{copy.account.tokenManager}</dt><dd>{copy.account.signedIn}</dd></div>
        </dl>
      </section>

      <section className="surface">
        <button
          type="button"
          className="btn"
          data-tone="danger"
          onClick={() => void account.signOut()}
        >
          {copy.auth.signOut}
        </button>
      </section>
    </div>
  );
}
