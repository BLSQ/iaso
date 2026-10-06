import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { Search } from '../../types/search';
import { OrgUnitsSearchMapLibre } from './OrgUnitsSearchMapLibre';
import { TileJSON } from './orgUnitTiles';

const { mockUseOrgUnitTileJSONs, mapProps } = vi.hoisted(() => ({
    mockUseOrgUnitTileJSONs: vi.fn(),
    mapProps: { current: undefined as Record<string, unknown> | undefined },
}));

type MockProps = Record<string, any>;

// jsdom has no WebGL: the map and its layers only render what they're given
vi.mock('../../../../components/maps/maplibre', async importOriginal => ({
    ...(await importOriginal<
        typeof import('../../../../components/maps/maplibre')
    >()),
    MapLibreMap: ({ children, controls, ...props }: MockProps) => {
        mapProps.current = props;
        return (
            <div data-testid="map">
                {controls}
                {children}
            </div>
        );
    },
}));
vi.mock('@vis.gl/react-maplibre', () => ({
    Source: ({ id, tiles, children }: MockProps) => (
        <div data-testid="source" data-id={id} data-tiles={tiles[0]}>
            {children}
        </div>
    ),
    Layer: ({ id, paint, filter }: MockProps) => (
        <div
            data-testid="layer"
            data-id={id}
            data-color={JSON.stringify(paint?.['fill-color'] ?? '')}
            data-filter={JSON.stringify(filter ?? null)}
        />
    ),
    Popup: ({ children }: MockProps) => <div>{children}</div>,
}));
vi.mock('./useOrgUnitTileJSON', () => ({
    useOrgUnitTileJSONs: mockUseOrgUnitTileJSONs,
}));
vi.mock('../../../../hooks/useGetColors', () => ({
    useGetColors: () => ({ data: ['#p0', '#p1', '#p2'] }),
}));

const tileJSON = (overrides: Partial<TileJSON>): TileJSON => ({
    tilejson: '3.0.0',
    tiles: ['http://testserver/tiles/{z}/{x}/{y}/?version_id=1'],
    minzoom: 0,
    maxzoom: 18,
    vector_layers: [],
    count: 0,
    located_count: 0,
    outside_fit_bounds: 0,
    org_unit_types: [],
    cluster: null,
    ...overrides,
});

const kwilu = tileJSON({
    tiles: ['http://testserver/tiles/{z}/{x}/{y}/?ancestor_id__or_self=7'],
    count: 29521,
    located_count: 28792,
    bounds: [-6, -11, 29, 50],
    fit_bounds: [15, -7, 21, -3],
    outside_fit_bounds: 31,
});
const facilities = tileJSON({
    tiles: ['http://testserver/tiles/{z}/{x}/{y}/?org_unit_type_id__in=41'],
    count: 17442,
    located_count: 6800,
    bounds: [12, -13, 31, 5],
    fit_bounds: [12, -13, 31, 5],
});

const colors = ['#111111', '#222222', '#333333'];

/** `clusters`: the user's pick, `auto` when they made none */
const renderMap = (searches: Search[], clusters: boolean | 'auto' = true) =>
    renderWithThemeAndIntlProvider(
        <OrgUnitsSearchMapLibre
            searches={searches}
            getSearchColor={index => colors[index]}
            clusters={clusters === 'auto' ? undefined : clusters}
            onClustersChange={vi.fn()}
        />,
    );

describe('OrgUnitsSearchMapLibre', () => {
    beforeEach(() => {
        mockUseOrgUnitTileJSONs.mockReset();
        mockUseOrgUnitTileJSONs.mockReturnValue([
            { data: kwilu, isLoading: false },
            { data: facilities, isLoading: false },
        ]);
    });

    it('draws each launched search from its own tiles, in its color', () => {
        renderMap([
            { levels: '7', version: '20' },
            { isAdded: true, orgUnitTypeId: '40' },
            { orgUnitTypeId: '41', version: '20' },
        ]);
        // the search being created isn't searched yet
        const [filters] = mockUseOrgUnitTileJSONs.mock.calls[0];
        expect(filters).toEqual([
            {
                ancestor_id__or_self: '7',
                version_id: '20',
                validation_status__in: 'VALID',
                fields: 'org_unit_type_id',
                cluster: 48,
            },
            {
                org_unit_type_id__in: '41',
                version_id: '20',
                validation_status__in: 'VALID',
                fields: 'org_unit_type_id',
                cluster: 48,
            },
        ]);
        const sources = screen.getAllByTestId('source');
        // a search keeps its position, so its color, whatever the searches before it
        expect(sources.map(source => source.dataset.id)).toEqual([
            'search-results-0',
            'search-results-2',
        ]);
        expect(sources[1].dataset.tiles).toBe(facilities.tiles[0]);
        const fills = screen
            .getAllByTestId('layer')
            .filter(layer =>
                /^search-results-\d+-fill$/.test(layer.dataset.id ?? ''),
            );
        expect(fills.map(layer => layer.dataset.color)).toEqual([
            '"#111111"',
            '"#333333"',
        ]);
    });

    it('only thins the points without clusters', () => {
        renderMap([{ version: '20' }], false);
        expect(mockUseOrgUnitTileJSONs.mock.calls[0][0][0].cluster).toBe(2);
    });

    it('counts the results and fits the map to them, outliers left out', () => {
        renderMap([{ levels: '7' }, { orgUnitTypeId: '41' }]);
        expect(
            screen.getByText('29,521 results, 28,792 on the map'),
        ).toBeInTheDocument();
        expect(screen.getByText('31 far from the others')).toBeInTheDocument();
        expect(mapProps.current?.bounds).toEqual([
            [12, -13],
            [31, 5],
        ]);
        // the map's "fit" button can show them all
        expect(mapProps.current?.fitTargets).toEqual([
            {
                key: 'results',
                label: 'Fit to the results',
                bounds: [
                    [12, -13],
                    [31, 5],
                ],
            },
            {
                key: 'all',
                label: 'Show all (31 far from the others)',
                bounds: [
                    [-6, -13],
                    [31, 50],
                ],
            },
        ]);
    });

    it('only offers to fit the results without outliers', () => {
        mockUseOrgUnitTileJSONs.mockReturnValue([
            { data: facilities, isLoading: false },
        ]);
        renderMap([{ orgUnitTypeId: '41' }]);
        expect(
            (mapProps.current?.fitTargets as { key: string }[]).map(
                ({ key }) => key,
            ),
        ).toEqual(['results']);
    });

    it('says which filters the map cannot apply', () => {
        renderMap([{ hasInstances: 'duplicates' }, {}]);
        expect(
            screen.getByText('Not applied on this map: hasInstances'),
        ).toBeInTheDocument();
    });

    it('lets the server decide whether to cluster, unless the user picked', () => {
        mockUseOrgUnitTileJSONs.mockReturnValue([
            { data: { ...kwilu, cluster: 48 }, isLoading: false },
        ]);
        renderMap([{ levels: '7' }], 'auto');
        expect(mockUseOrgUnitTileJSONs.mock.calls[0][0][0].cluster).toBe(
            'auto',
        );
        // the button shows what the server picked
        expect(
            screen.getByRole('button', {
                name: 'Group nearby results into clusters (automatic, from the number of results)',
            }),
        ).toHaveAttribute('aria-pressed', 'true');
    });

    it('overrides the clusters from the map', () => {
        const onClustersChange = vi.fn();
        renderWithThemeAndIntlProvider(
            <OrgUnitsSearchMapLibre
                searches={[{ levels: '7' }, { orgUnitTypeId: '41' }]}
                getSearchColor={index => colors[index]}
                clusters={false}
                onClustersChange={onClustersChange}
            />,
        );
        const button = screen.getByRole('button', {
            name: 'Group nearby results into clusters',
        });
        expect(button).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(button);
        expect(onClustersChange).toHaveBeenCalledWith(true);
    });

    describe('a single search', () => {
        const byType = {
            ...kwilu,
            cluster: 48,
            org_unit_types: [
                {
                    id: 42,
                    name: 'Village',
                    depth: 4,
                    count: 27861,
                    located_count: 25796,
                },
                {
                    id: 41,
                    name: 'Health facility',
                    depth: 4,
                    count: 6486,
                    located_count: 6120,
                },
                {
                    id: null,
                    name: null,
                    depth: null,
                    count: 3,
                    located_count: 1,
                },
            ],
        };
        const fill = () =>
            screen
                .getAllByTestId('layer')
                .find(
                    layer => layer.dataset.id === 'search-results-0-fill',
                ) as HTMLElement;

        beforeEach(() => {
            mockUseOrgUnitTileJSONs.mockReturnValue([
                { data: byType, isLoading: false },
            ]);
        });

        it('is drawn by org unit type, its clusters split by type', () => {
            renderMap([{ levels: '7' }], 'auto');
            expect(mockUseOrgUnitTileJSONs.mock.calls[0][0][0].cluster_by).toBe(
                'org_unit_type_id',
            );
            // colors by type id from the palette (42 % 3, 41 % 3), grey without type
            expect(JSON.parse(fill().dataset.color as string)).toEqual([
                'match',
                ['coalesce', ['get', 'org_unit_type_id'], -1],
                42,
                '#p0',
                41,
                '#p2',
                '#9e9e9e',
            ]);
            expect(screen.getByText('Village')).toBeInTheDocument();
            expect(screen.getByText('25,796')).toBeInTheDocument();
            expect(screen.getByText('No type')).toBeInTheDocument();
        });

        it('hides and shows a type from the legend, without new tiles', () => {
            renderMap([{ levels: '7' }], 'auto');
            const tileRequests = mockUseOrgUnitTileJSONs.mock.calls.length;
            fireEvent.click(screen.getByRole('checkbox', { name: /Village/ }));
            expect(JSON.parse(fill().dataset.filter as string)[2]).toEqual([
                '!',
                [
                    'in',
                    ['coalesce', ['get', 'org_unit_type_id'], -1],
                    ['literal', [42]],
                ],
            ]);
            expect(
                screen.getByRole('checkbox', { name: /Village/ }),
            ).not.toBeChecked();
            // the same tiles, filtered
            expect(
                mockUseOrgUnitTileJSONs.mock.calls
                    .slice(tileRequests)
                    .every(([filters]) => filters[0].cluster === 'auto'),
            ).toBe(true);
            fireEvent.click(screen.getByRole('checkbox', { name: /Village/ }));
            expect(JSON.parse(fill().dataset.filter as string)[0]).toBe(
                'match',
            );
        });
    });

    it('keeps several searches in their colors, without legend', () => {
        renderMap([{ levels: '7' }, { orgUnitTypeId: '41' }]);
        expect(
            mockUseOrgUnitTileJSONs.mock.calls[0][0][0].cluster_by,
        ).toBeUndefined();
        expect(screen.queryByText('No type')).not.toBeInTheDocument();
    });
});
