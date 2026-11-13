import { architectureRoots, type ArchitectureRoot } from '../../composition/architectures';
import { integratedComponents, type IntegratedComponent } from '../../composition/components';

type MiniComponent = IntegratedComponent & { mark: string };
type MiniSurface = ArchitectureRoot & { mark: string };

type PageData = {
  appName: string;
  appCode: string;
  activeTab: string;
  linkedCount: number;
  plannedCount: number;
  iamLinked: boolean;
  iamPackage: string;
  components: readonly MiniComponent[];
  surfaces: readonly MiniSurface[];
};

const linkedCount = integratedComponents.filter((component) => component.supported).length;
const components: MiniComponent[] = integratedComponents.map((component) => ({
  ...component,
  mark: component.id.slice(0, 2).toUpperCase(),
}));
const surfaces: MiniSurface[] = architectureRoots.map((root) => ({
  ...root,
  mark: root.id.slice(0, 2).toUpperCase(),
}));
const iam = integratedComponents.find((component) => component.id === 'iam');

Page({
  data: {
    appName: 'SDKWork Drama',
    appCode: 'sdkwork-drama',
    activeTab: 'overview',
    linkedCount,
    plannedCount: integratedComponents.length - linkedCount,
    iamLinked: iam?.supported === true,
    iamPackage: iam?.sdkPackage ?? '',
    components,
    surfaces,
  } satisfies PageData,

  switchTab(event: { currentTarget: { dataset: { tab?: string } } }): void {
    const tab = event.currentTarget.dataset.tab;
    if (tab === 'overview' || tab === 'surfaces' || tab === 'components' || tab === 'me') {
      const page = this as unknown as { setData(data: Partial<PageData>): void };
      page.setData({ activeTab: tab });
    }
  },
});
