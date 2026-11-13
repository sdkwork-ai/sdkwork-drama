export type TabIconName = 'overview' | 'episodes' | 'account' | 'media';

const OUTLINE_PATHS: Readonly<Record<TabIconName, string>> = {
  overview: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  episodes: 'M4 6h16v13H4zM4 6l2-3h12l2 3M9 10v6l5-3z',
  media: 'M4 5h16v14H4zM4 15l4-4 3 3 3-3 6 6',
  account: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM5 20a7 7 0 0 1 14 0',
};

const FILLED_PATHS: Readonly<Record<TabIconName, string>> = {
  overview: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  episodes: 'M4 6h16v13H4zM6 3h12l2 3H4zM9 10h2v6l5-3z',
  media: 'M4 5h16v14H4zM5 15l3.5-3.5 2.5 2.5 2.5-2.5L19 18H5z',
  account: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM4 21a8 8 0 0 1 16 0z',
};

/** Active tab renders the filled variant, every inactive tab the outline variant (ICON_SPEC §3.2). */
export function TabIcon({
  name,
  active,
}: {
  readonly name: TabIconName;
  readonly active: boolean;
}) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={active ? 'currentColor' : 'none'}
      stroke={active ? 'none' : 'currentColor'}
      strokeWidth={active ? 0 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={active ? FILLED_PATHS[name] : OUTLINE_PATHS[name]} />
    </svg>
  );
}
