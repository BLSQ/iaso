import React, { useEffect } from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import OrgUnitDetail from './details';

const {
    mockUseParamsObject,
    mockUseOrgUnitDetailData,
    mockUseSaveOrgUnit,
    mockUseRefreshOrgUnit,
    mockUseGetOrgunitsExtraPath,
    mockUseCurrentUser,
    mockUseCheckUserHasWritePermissionOnOrgunit,
} = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
    mockUseOrgUnitDetailData: vi.fn(),
    mockUseSaveOrgUnit: vi.fn(),
    mockUseRefreshOrgUnit: vi.fn(),
    mockUseGetOrgunitsExtraPath: vi.fn(),
    mockUseCurrentUser: vi.fn(),
    mockUseCheckUserHasWritePermissionOnOrgunit: vi.fn(),
}));

vi.mock('../../routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock('./hooks', async importOriginal => {
    const actual = await importOriginal<typeof import('./hooks')>();
    return {
        ...actual,
        useOrgUnitDetailData: mockUseOrgUnitDetailData,
        useSaveOrgUnit: mockUseSaveOrgUnit,
        useRefreshOrgUnit: mockUseRefreshOrgUnit,
    };
});

vi.mock('../home/hooks/useGetOrgunitsExtraPath', () => ({
    useGetOrgunitsExtraPath: mockUseGetOrgunitsExtraPath,
}));

vi.mock('../../utils/usersUtils', async importOriginal => {
    const actual =
        await importOriginal<typeof import('../../utils/usersUtils')>();
    return {
        ...actual,
        useCurrentUser: mockUseCurrentUser,
        useCheckUserHasWritePermissionOnOrgunit:
            mockUseCheckUserHasWritePermissionOnOrgunit,
    };
});

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
        }),
        useGoBack: () => vi.fn(),
        useRedirectToReplace: () => vi.fn(),
    };
});

vi.mock('../../components/nav/TopBarComponent', () => ({
    default: () => <div data-testid="top-bar" />,
}));

vi.mock('./components/breadcrumbs/OrgUnitBreadcrumbs', () => ({
    OrgUnitBreadcrumbs: () => <div data-testid="breadcrumbs" />,
}));

vi.mock('./components/OrgUnitForm', () => ({
    OrgUnitForm: () => <div data-testid="org-unit-form" />,
}));

vi.mock('./components/OrgUnitImages', () => ({
    OrgUnitImages: () => <div data-testid="org-unit-images" />,
}));

vi.mock('./components/orgUnitMap/OrgUnitComments/OrgUnitsMapComments', () => ({
    OrgUnitsMapComments: () => <div data-testid="org-unit-comments" />,
}));

// This is the component under test for the tab-gating behaviour: it must
// only mount when the "map" tab is active.
vi.mock('./components/orgUnitMap/OrgUnitMap/OrgUnitMap', () => ({
    OrgUnitMap: () => <div data-testid="org-unit-map" />,
}));

vi.mock('./details/Children/OrgUnitChildren', () => ({
    OrgUnitChildren: () => <div data-testid="org-unit-children" />,
}));

vi.mock('./details/Links/OrgUnitLinks', () => ({
    OrgUnitLinks: () => <div data-testid="org-unit-links" />,
}));

vi.mock('./history/LogsComponent', () => ({
    Logs: () => <div data-testid="logs" />,
}));

vi.mock('../forms/components/FormsTable', () => ({
    FormsTable: () => <div data-testid="forms-table" />,
}));

const fakeOrgUnit = {
    id: 1,
    name: 'Test Org Unit',
    org_unit_type_id: 2,
} as any;

describe('OrgUnitDetail - map tab gating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetOrgunitsExtraPath.mockReturnValue('');
        mockUseCurrentUser.mockReturnValue({ permissions: [] } as any);
        mockUseCheckUserHasWritePermissionOnOrgunit.mockReturnValue(false);
        mockUseSaveOrgUnit.mockReturnValue({
            mutateAsync: vi.fn(),
            isLoading: false,
        });
        mockUseRefreshOrgUnit.mockReturnValue(vi.fn());
        mockUseOrgUnitDetailData.mockImplementation(
            (isNewOrgunit, _orgUnitId, setCurrentOrgUnit) => {
                // Mirrors the real hook's onSuccess callback: set the
                // current org unit as an effect, not during render.
                useEffect(() => {
                    if (!isNewOrgunit) {
                        setCurrentOrgUnit(fakeOrgUnit);
                    }
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [isNewOrgunit]);
                return {
                    groups: [],
                    orgUnitTypes: [],
                    links: [],
                    sources: [],
                    isFetchingDatas: false,
                    originalOrgUnit: fakeOrgUnit,
                    isFetchingDetail: false,
                    isFetchingOrgUnitTypes: false,
                    isFetchingGroups: false,
                    parentOrgUnit: undefined,
                    isFetchingSources: false,
                };
            },
        );
    });

    const setParamsTab = (tab: string) => {
        mockUseParamsObject.mockReturnValue({
            accountId: '1',
            orgUnitId: '1',
            tab,
            levels: '1',
        });
    };

    it('renders OrgUnitMap when the map tab is active', () => {
        setParamsTab('map');
        renderWithThemeAndIntlProvider(<OrgUnitDetail />);

        expect(screen.getByTestId('org-unit-map')).toBeInTheDocument();
    });

    it.each([
        'infos',
        'children',
        'links',
        'history',
        'forms',
        'images',
        'comments',
    ])('does not render OrgUnitMap when the %s tab is active', tab => {
        setParamsTab(tab);
        renderWithThemeAndIntlProvider(<OrgUnitDetail />);

        expect(screen.queryByTestId('org-unit-map')).not.toBeInTheDocument();
    });
});
