import { useState, type FormEvent } from 'react';

import { useIamAccount } from './account/use-iam-account';
import { integratedComponents } from './composition/components';

const surface: string = 'h5';
const surfaceTitle = 'H5';
const architectureRoots = [{"id":"pc","title":"PC","suffix":"pc","root":"apps/sdkwork-drama-pc","packageName":"sdkwork-drama-pc","kind":"web"},{"id":"h5","title":"H5","suffix":"h5","root":"apps/sdkwork-drama-h5","packageName":"sdkwork-drama-h5","kind":"web"}];

type MobileTab = 'overview' | 'surfaces' | 'components' | 'me';

function resolveInitialTab(): MobileTab {
  const tab = new URLSearchParams(window.location.search).get('tab');
  return tab === 'surfaces' || tab === 'components' || tab === 'me' ? tab : 'overview';
}
const deploymentProfile = import.meta.env.VITE_SDKWORK_DEPLOYMENT_PROFILE
  ?? import.meta.env.MODE;

type FoundationStep = {
  readonly title: string;
  readonly body: string;
  readonly state: 'ready' | 'pending';
};

const steps: readonly FoundationStep[] = [
  {
    title: 'Repository baseline',
    body: 'Canon documentation, application identity, workspace metadata, and the standard root directory dictionary are in place.',
    state: 'ready',
  },
  {
    title: 'Architecture surfaces',
    body: 'Web, tablet, native, Flutter, and mini-program roots share one product identity while keeping independent architecture roots.',
    state: 'ready',
  },
  {
    title: 'First vertical workflow',
    body: 'Add requirements, API contracts, generated SDKs, and package-level feature modules before building product screens.',
    state: 'pending',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>(resolveInitialTab);
  const isMobile = surface === 'h5';
  const selectTab = (tab: MobileTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };
  const linked = integratedComponents.filter((component) => component.supported).length;
  const planned = integratedComponents.length - linked;
  const iam = integratedComponents.find((component) => component.id === 'iam');
  const iamLinked = Boolean(iam?.supported);
  const account = useIamAccount();
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const accountName = account.snapshot.status === 'authenticated'
    ? (account.snapshot.profile.displayName ?? 'Signed in')
    : !iamLinked
      ? 'IAM is not selected'
      : account.loading
        ? 'Checking IAM session…'
        : 'IAM integration ready';
  const accountBadge = account.snapshot.status === 'authenticated'
    ? 'Signed in'
    : iamLinked
      ? 'Ready'
      : 'Plan';

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const outcome = await account.login({
      account: loginAccount,
      password: loginPassword,
    });
    if (outcome.status === 'unavailable') {
      setLoginMessage(outcome.reason);
      return;
    }
    if (outcome.status === 'selection-required') {
      setLoginMessage('Choose the organization for this session.');
      return;
    }
    setLoginMessage('');
    setLoginPassword('');
  };

  const chooseOrganization = async (organizationId: string) => {
    const outcome = await account.selectOrganization(organizationId);
    if (outcome.status === 'unavailable') {
      setLoginMessage(outcome.reason);
      return;
    }
    setLoginMessage('');
  };

  return (
    <div className="scaffold-app" data-surface={surface} data-active-tab={activeTab}>
      <aside className="scaffold-rail">
        <a className="scaffold-rail-brand" href="#overview" aria-label="SDKWork Drama home">
          D
        </a>
        <nav className="scaffold-rail-nav" aria-label="Application sections">
          <a className="scaffold-rail-item" href="#overview" aria-current="page">
            <span className="scaffold-rail-icon" aria-hidden="true">◫</span>
            <span>Overview</span>
          </a>
          <a className="scaffold-rail-item" href="#surfaces">
            <span className="scaffold-rail-icon" aria-hidden="true">▤</span>
            <span>Surfaces</span>
          </a>
          <a className="scaffold-rail-item" href="#components">
            <span className="scaffold-rail-icon" aria-hidden="true">◇</span>
            <span>Components</span>
          </a>
          <a className="scaffold-rail-item" href="#me">
            <span className="scaffold-rail-icon" aria-hidden="true">◎</span>
            <span>Me</span>
          </a>
        </nav>
        <div className="scaffold-rail-footer">
          <span className="scaffold-rail-meta">{deploymentProfile}</span>
          <code>pnpm dev</code>
        </div>
      </aside>

      <header className="scaffold-mobile-appbar">
        <span className="scaffold-rail-brand" aria-hidden="true">D</span>
        <strong>SDKWork Drama</strong>
        <span className="scaffold-surface-chip">{surfaceTitle}</span>
      </header>

      <main className="scaffold-main">
        <header className="scaffold-page-header">
          <div>
            <p className="scaffold-eyebrow">SDKWork application foundation</p>
            <h1 className="scaffold-page-title">SDKWork Drama</h1>
            <p className="scaffold-page-subtitle">
              Short-drama (短剧) video creation application: episode authoring, media assets, publishing, and playback.
            </p>
          </div>
          <div className="scaffold-header-actions">
            <a className="scaffold-button" data-tone="primary" href="#components">Review components</a>
            <span className="scaffold-surface-chip">{surfaceTitle} surface</span>
          </div>
        </header>

        <section className="scaffold-overview" id="overview" aria-label="Foundation overview">
          <article className="scaffold-stat">
            <span className="scaffold-stat-label">Architectures</span>
            <strong className="scaffold-stat-value">{architectureRoots.length}</strong>
          </article>
          <article className="scaffold-stat">
            <span className="scaffold-stat-label">Components</span>
            <strong className="scaffold-stat-value">{integratedComponents.length}</strong>
          </article>
          <article className="scaffold-stat">
            <span className="scaffold-stat-label">Linked SDKs</span>
            <strong className="scaffold-stat-value">{linked}</strong>
          </article>
          <article className="scaffold-stat">
            <span className="scaffold-stat-label">Profile</span>
            <strong className="scaffold-stat-value scaffold-stat-value-small">{deploymentProfile}</strong>
          </article>
        </section>

        <section className="scaffold-panel" aria-labelledby="foundation-title">
          <div className="scaffold-panel-head">
            <div>
              <h2 className="scaffold-panel-title" id="foundation-title">Foundation status</h2>
              <p className="scaffold-panel-subtitle">The initial delivery boundary is visible and explicit.</p>
            </div>
            <span className="scaffold-badge" data-status="ok">Ready</span>
          </div>
          <div className="scaffold-step-grid">
            {steps.map((step, index) => (
              <article className="scaffold-step" key={step.title}>
                <span className={`scaffold-step-index ${step.state}`}>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <span className="scaffold-badge" data-status={step.state === 'ready' ? 'ok' : 'warn'}>
                  {step.state === 'ready' ? 'Ready' : 'Next'}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="scaffold-panel" id="surfaces" aria-labelledby="surfaces-title">
          <div className="scaffold-panel-head">
            <div>
              <h2 className="scaffold-panel-title" id="surfaces-title">Surfaces</h2>
              <p className="scaffold-panel-subtitle">Each architecture keeps its own root, manifest, and toolchain.</p>
            </div>
            <span className="scaffold-badge" data-status="skipped">{architectureRoots.length} roots</span>
          </div>
          <ul className="scaffold-list">
            {architectureRoots.map((architecture) => (
              <li className="scaffold-list-row" key={architecture.id}>
                <span className="scaffold-list-mark" aria-hidden="true">
                  {architecture.id.slice(0, 2).toUpperCase()}
                </span>
                <span className="scaffold-list-copy">
                  <strong>{architecture.id === surface ? `${architecture.title} · current` : architecture.title}</strong>
                  <code>{architecture.root}</code>
                </span>
                <span className="scaffold-list-meta">{architecture.kind}</span>
                <span className="scaffold-badge" data-status={architecture.kind === 'web' ? 'ok' : 'skipped'}>
                  {architecture.kind === 'web' ? 'Buildable' : 'Toolchain'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="scaffold-panel" id="components" aria-labelledby="components-title">
          <div className="scaffold-panel-head">
            <div>
              <h2 className="scaffold-panel-title" id="components-title">Component composition</h2>
              <p className="scaffold-panel-subtitle">
                {linked} linked · {planned} planned · resolved from sibling SDK manifests.
              </p>
            </div>
            <span className="scaffold-badge" data-status={planned > 0 ? 'warn' : 'ok'}>
              {planned > 0 ? 'Review plan' : 'All linked'}
            </span>
          </div>
          {integratedComponents.length === 0 ? (
            <p className="scaffold-empty">No common component is enabled for this application.</p>
          ) : (
            <div className="scaffold-component-grid">
              {integratedComponents.map((component) => (
                <article className="scaffold-component" key={component.id}>
                  <div className="scaffold-component-head">
                    <span className="scaffold-component-mark" aria-hidden="true">
                      {component.id.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="scaffold-badge" data-status={component.supported ? 'ok' : 'warn'}>
                      {component.supported ? 'Linked' : 'Plan'}
                    </span>
                  </div>
                  <h3>{component.title}</h3>
                  <p>{component.description}</p>
                  <code>{component.sdkPackage ?? `${component.repo} runtime`}</code>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="scaffold-panel" id="me" aria-labelledby="me-title">
          <div className="scaffold-panel-head">
            <div>
              <h2 className="scaffold-panel-title" id="me-title">My account</h2>
              <p className="scaffold-panel-subtitle">Identity, session, and account security through sdkwork-iam.</p>
            </div>
            <span className="scaffold-badge" data-status={iamLinked ? 'ok' : 'warn'}>
              {accountBadge}
            </span>
          </div>

          <div className="scaffold-account">
            <div className="scaffold-account-identity">
              <span className="scaffold-account-avatar" aria-hidden="true">D</span>
              <div>
                <strong>{accountName}</strong>
                <p>
                  {iamLinked
                    ? 'Connect the IAM runtime with a base URL and the global token manager to load the signed-in profile.'
                    : 'Select the iam component to enable account, session, and security capabilities.'}
                </p>
              </div>
            </div>

            <div className="scaffold-account-facts">
              <div>
                <span>Application</span>
                <strong>sdkwork-drama</strong>
              </div>
              <div>
                <span>IAM package</span>
                <strong>{iam?.sdkPackage ?? '—'}</strong>
              </div>
              <div>
                <span>Tenant</span>
                <strong>Loaded at runtime</strong>
              </div>
              <div>
                <span>Session</span>
                <strong>Global token manager</strong>
              </div>
            </div>

            <div className="scaffold-account-actions">
              <code>src/account/iam-account.ts</code>
              <span className="scaffold-badge" data-status={iamLinked ? 'ok' : 'warn'}>
                {iamLinked ? 'Service generated' : 'Unavailable'}
              </span>
            </div>
          </div>

          {iamLinked ? (
            account.snapshot.status === 'authenticated' ? (
              <div className="scaffold-session-actions">
                <div>
                  <strong>Signed in through sdkwork-iam</strong>
                  <span>Session and profile are resolved at runtime.</span>
                </div>
                <button type="button" className="scaffold-button" onClick={() => void account.signOut()}>
                  Sign out
                </button>
              </div>
            ) : (
              <form className="scaffold-login" onSubmit={(event) => void submitLogin(event)}>
                <div className="scaffold-login-head">
                  <div>
                    <p className="scaffold-eyebrow">IAM sign-in</p>
                    <h3>Use your application account</h3>
                  </div>
                  <span className="scaffold-badge" data-status={account.configured ? 'ok' : 'warn'}>
                    {account.configured ? 'Runtime configured' : 'Runtime missing'}
                  </span>
                </div>

                <div className="scaffold-login-fields">
                  <label>
                    <span>Account</span>
                    <input
                      type="text"
                      name="account"
                      autoComplete="username"
                      value={loginAccount}
                      onChange={(event) => setLoginAccount(event.target.value)}
                      disabled={!account.configured || account.loading}
                      required
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      disabled={!account.configured || account.loading}
                      required
                    />
                  </label>
                </div>

                <div className="scaffold-login-actions">
                  <button
                    type="submit"
                    className="scaffold-button"
                    data-tone="primary"
                    disabled={!account.configured || account.loading}
                  >
                    {account.loading ? 'Signing in…' : 'Sign in'}
                  </button>
                  <span>
                    {account.configured
                      ? 'auth.sessions.create · password grant'
                      : 'Set VITE_SDKWORK_API_BASE_URL to enable IAM sign-in.'}
                  </span>
                </div>

                {loginMessage ? (
                  <p className="scaffold-login-message" role="alert">{loginMessage}</p>
                ) : null}

                {account.selection ? (
                  <div className="scaffold-organization-picker">
                    <span className="scaffold-stat-label">Choose organization</span>
                    <div>
                      {account.selection.organizations.map((organization) => (
                        <button
                          type="button"
                          className="scaffold-button"
                          key={organization.organizationId}
                          onClick={() => void chooseOrganization(organization.organizationId)}
                        >
                          {organization.displayName ?? organization.organizationId}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </form>
            )
          ) : null}

          <div className="scaffold-account-links">
            <div><strong>Profile</strong><span>Display name, email, phone</span><code>iam.users.current</code></div>
            <div><strong>Session</strong><span>Retrieve and revoke the current session</span><code>auth.sessions.current</code></div>
            <div><strong>Security</strong><span>Password and binding changes</span><code>iam.users.current</code></div>
            <div><strong>Preferences</strong><span>Locale, theme, and notification defaults</span><code>config/components</code></div>
          </div>
        </section>

        <section className="scaffold-callout" aria-label="Next step">
          <div>
            <p className="scaffold-eyebrow">Recommended next move</p>
            <h2>Write the requirement before the screen.</h2>
          </div>
          <p>
            Capture the first workflow in <code>docs/product/prd/PRD.md</code>, record the boundary
            decision, then add API, SDK, and package work through the owning architecture standard.
          </p>
        </section>

        <footer className="scaffold-footer">
          <span>sdkwork-drama · {surfaceTitle}</span>
          <span>Generated 2026-11-13</span>
        </footer>
      </main>

      {isMobile ? (
        <nav className="scaffold-bottom-tabs" aria-label="Mobile sections">
          <button
            type="button"
            className="scaffold-bottom-tab"
            aria-current={activeTab === 'overview' ? 'page' : undefined}
            onClick={() => selectTab('overview')}
          >
            <span aria-hidden="true">◫</span>
            <span>Overview</span>
          </button>
          <button
            type="button"
            className="scaffold-bottom-tab"
            aria-current={activeTab === 'surfaces' ? 'page' : undefined}
            onClick={() => selectTab('surfaces')}
          >
            <span aria-hidden="true">▤</span>
            <span>Surfaces</span>
          </button>
          <button
            type="button"
            className="scaffold-bottom-tab"
            aria-current={activeTab === 'components' ? 'page' : undefined}
            onClick={() => selectTab('components')}
          >
            <span aria-hidden="true">◇</span>
            <span>Components</span>
          </button>
          <button
            type="button"
            className="scaffold-bottom-tab"
            aria-current={activeTab === 'me' ? 'page' : undefined}
            onClick={() => selectTab('me')}
          >
            <span aria-hidden="true">◎</span>
            <span>Me</span>
          </button>
        </nav>
      ) : null}
    </div>
  );
}
