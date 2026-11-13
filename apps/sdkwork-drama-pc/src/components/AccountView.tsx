import type { UseIamAccount } from '../account/use-iam-account';
import { copy } from '../i18n';

export function AccountView({ account }: { readonly account: UseIamAccount }) {
  const snapshot = account.snapshot;
  const profile = snapshot.status === 'authenticated' ? snapshot.profile : null;
  const displayName = profile?.displayName?.trim() || profile?.email?.trim() || 'Signed in user';

  return (
    <div className="account-view">
      <section className="panel account-card" aria-label={copy.account.title}>
        <div className="panel-head">
          <div>
            <h2>{copy.account.title}</h2>
            <p>{copy.account.subtitle}</p>
          </div>
          <button
            type="button"
            className="button"
            data-tone="danger"
            onClick={() => void account.signOut()}
          >
            {copy.auth.signOut}
          </button>
        </div>

        <div className="account-identity">
          <span className="account-avatar" aria-hidden="true">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{displayName}</strong>
            <p>{profile?.email ?? profile?.phone ?? 'Profile projection unavailable'}</p>
          </div>
          <span className="status-badge" data-status="published">
            {profile ? copy.account.signedIn : copy.common.unavailable}
          </span>
        </div>

        <dl className="account-facts">
          <div>
            <dt>{copy.account.tenant}</dt>
            <dd><code>{profile?.tenantId ?? copy.account.none}</code></dd>
          </div>
          <div>
            <dt>{copy.account.organization}</dt>
            <dd><code>{profile?.organizationId ?? copy.account.none}</code></dd>
          </div>
          <div>
            <dt>{copy.account.session}</dt>
            <dd><code>{profile?.sessionId ?? copy.account.none}</code></dd>
          </div>
          <div>
            <dt>{copy.account.tokenManager}</dt>
            <dd>{copy.account.signedIn}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
