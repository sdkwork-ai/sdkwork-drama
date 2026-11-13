import { useState, type FormEvent } from 'react';

import type { UseIamAccount } from '../account/use-iam-account';
import { copy } from '../i18n';

export function AuthScreen({
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
    if (outcome.status === 'unavailable') setMessage(outcome.reason);
    else if (outcome.status === 'selection-required') setMessage(copy.auth.organizationHint);
    else setPassword('');
  };

  const choose = async (organizationId: string) => {
    const outcome = await account.selectOrganization(organizationId);
    if (outcome.status === 'unavailable') setMessage(outcome.reason);
  };

  return (
    <div className="auth">
      <header className="auth-head">
        <span className="auth-mark" aria-hidden="true">SD</span>
        <h1>{copy.app.name}</h1>
        <p>{copy.app.description}</p>
      </header>

      {selection ? (
        <section className="surface auth-surface">
          <p className="eyebrow">{copy.auth.organizationTitle}</p>
          <h2>{copy.auth.organizationHint}</h2>
          <div className="picker-list">
            {selection.organizations.map((organization) => (
              <button
                key={organization.organizationId}
                type="button"
                className="picker-cell"
                onClick={() => void choose(organization.organizationId)}
              >
                <span>{organization.displayName ?? organization.organizationId}</span>
                <code>{organization.organizationId}</code>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="surface auth-surface">
          <p className="eyebrow">{copy.auth.title}</p>
          <h2>{copy.auth.subtitle}</h2>
          {unavailable ? (
            <p className="form-note" role="status">
              {copy.auth.unavailable} {copy.auth.configureHint}
            </p>
          ) : null}
          <form className="field-stack" onSubmit={(event) => void submit(event)}>
            <label className="field">
              <span>{copy.auth.account}</span>
              <input
                type="text"
                autoComplete="username"
                value={accountValue}
                onChange={(event) => setAccountValue(event.target.value)}
                disabled={unavailable || account.loading}
                required
              />
            </label>
            <label className="field">
              <span>{copy.auth.password}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={unavailable || account.loading}
                required
              />
            </label>
            <button
              type="submit"
              className="btn"
              data-tone="primary"
              disabled={unavailable || account.loading}
            >
              {account.loading ? copy.auth.signingIn : copy.auth.signIn}
            </button>
          </form>
          {message ? <p className="form-error" role="alert">{message}</p> : null}
          <p className="auth-runtime">{runtimeConfigured ? 'Runtime endpoint configured' : 'Runtime endpoint missing'}</p>
        </section>
      )}
    </div>
  );
}
