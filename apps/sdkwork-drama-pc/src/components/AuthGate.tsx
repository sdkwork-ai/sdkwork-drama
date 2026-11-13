import { useState, type FormEvent } from 'react';

import type { UseIamAccount } from '../account/use-iam-account';
import { copy } from '../i18n';

export function AuthGate({
  account,
  runtimeConfigured,
}: {
  readonly account: UseIamAccount;
  readonly runtimeConfigured: boolean;
}) {
  const [accountValue, setAccountValue] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const unavailable = !runtimeConfigured || !account.configured;
  const selection = account.selection;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const outcome = await account.login({ account: accountValue, password });
    if (outcome.status === 'unavailable') {
      setMessage(outcome.reason);
      return;
    }
    if (outcome.status === 'selection-required') {
      setMessage(copy.auth.organizationHint);
      return;
    }
    setPassword('');
  };

  const choose = async (organizationId: string) => {
    const outcome = await account.selectOrganization(organizationId);
    if (outcome.status === 'unavailable') setMessage(outcome.reason);
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero" aria-label={copy.app.name}>
        <span className="auth-mark" aria-hidden="true">SD</span>
        <p className="eyebrow">{copy.app.tagline}</p>
        <h1>{copy.app.name}</h1>
        <p className="auth-lead">{copy.app.description}</p>
        <ul className="auth-points">
          <li>Episode authoring with cursor pagination and publishing.</li>
          <li>Cover, video, audio, and subtitle assets through SDKWork Drive.</li>
          <li>Tenant-scoped sessions through sdkwork-iam.</li>
        </ul>
      </section>

      <section className="auth-card" aria-label={copy.auth.title}>
        {selection ? (
          <>
            <p className="eyebrow">{copy.auth.organizationTitle}</p>
            <h2>{copy.auth.organizationHint}</h2>
            <div className="org-list">
              {selection.organizations.map((organization) => (
                <button
                  key={organization.organizationId}
                  type="button"
                  className="org-option"
                  onClick={() => void choose(organization.organizationId)}
                >
                  <strong>{organization.displayName ?? organization.organizationId}</strong>
                  <code>{organization.organizationId}</code>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">{copy.auth.title}</p>
            <h2>{copy.auth.subtitle}</h2>
            {unavailable ? (
              <p className="form-note" role="status">
                {copy.auth.unavailable} {copy.auth.configureHint}
              </p>
            ) : null}
            <form className="auth-form" onSubmit={(event) => void submit(event)}>
              <label>
                <span>{copy.auth.account}</span>
                <input
                  type="text"
                  name="account"
                  autoComplete="username"
                  value={accountValue}
                  onChange={(event) => setAccountValue(event.target.value)}
                  disabled={unavailable || account.loading}
                  required
                />
              </label>
              <label>
                <span>{copy.auth.password}</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={unavailable || account.loading}
                  required
                />
              </label>
              <button
                type="submit"
                className="button"
                data-tone="primary"
                disabled={unavailable || account.loading}
              >
                {account.loading ? copy.auth.signingIn : copy.auth.signIn}
              </button>
            </form>
            {message ? <p className="form-error" role="alert">{message}</p> : null}
            <p className="auth-runtime" data-configured={runtimeConfigured ? 'yes' : 'no'}>
              {runtimeConfigured ? 'Runtime endpoint configured' : 'Runtime endpoint missing'}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
