import { copy } from '../i18n';
import { NavIcon, type NavIconName } from './NavIcon';

export type RailView = 'overview' | 'episodes' | 'account';

const ITEMS: readonly { readonly id: RailView; readonly icon: NavIconName; readonly label: string }[] = [
  { id: 'overview', icon: 'overview', label: copy.nav.overview },
  { id: 'episodes', icon: 'episodes', label: copy.nav.episodes },
  { id: 'account', icon: 'account', label: copy.nav.account },
];

export function Rail({
  view,
  onChange,
  displayName,
}: {
  readonly view: RailView;
  readonly onChange: (view: RailView) => void;
  readonly displayName: string;
}) {
  return (
    <aside className="rail" aria-label="Studio navigation">
      <span className="rail-brand" aria-label={copy.app.name}>SD</span>
      <nav className="rail-nav">
        {ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="rail-item"
              data-active={active ? 'true' : 'false'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange(item.id)}
              title={item.label}
            >
              <NavIcon name={item.icon} active={active} className="rail-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="rail-footer">
        <span className="rail-avatar" aria-hidden="true">{displayName.slice(0, 2).toUpperCase()}</span>
        <span className="rail-name">{displayName}</span>
        <span className="rail-meta">drama</span>
      </div>
    </aside>
  );
}
