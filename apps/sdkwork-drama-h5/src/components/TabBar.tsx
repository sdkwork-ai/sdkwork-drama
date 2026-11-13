import { copy } from '../i18n';
import { TabIcon, type TabIconName } from './TabIcon';

export type TabId = 'overview' | 'episodes' | 'account';

const TABS: readonly { readonly id: TabId; readonly icon: TabIconName; readonly label: string }[] = [
  { id: 'overview', icon: 'overview', label: copy.nav.overview },
  { id: 'episodes', icon: 'episodes', label: copy.nav.episodes },
  { id: 'account', icon: 'account', label: copy.nav.account },
];

export function TabBar({
  active,
  onChange,
}: {
  readonly active: TabId;
  readonly onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className="tabbar-item"
            data-active={selected ? 'true' : 'false'}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
          >
            <TabIcon name={tab.icon} active={selected} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
