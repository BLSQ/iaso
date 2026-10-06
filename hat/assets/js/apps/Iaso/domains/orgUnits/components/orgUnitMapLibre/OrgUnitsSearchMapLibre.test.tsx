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
    MapLibreMap: ({ children, ...props }: MockProps) => {
        mapProps.current = props;
        return <div data-testid="map">{children}</div>;
    },
}));
vi.mock('@vis.gl/react-maplibre', () => ({
    Source: ({ id, tiles, children }: MockProps) => (
        <div data-testid="source" data-id={id} data-tiles={tiles[0]}>
            {children}
        </div>
    ),
    Layer: ({ id, paint }: MockProps) => (
        <div
            data-testid="layer"
            data-id={id}
            data-color={paint?.['fill-color'] ?? ''}
        />
    ),
    Popup: ({ children }: MockProps) => <div>{children}</div>,
}));
vi.mock('./useOrgUnitTileJSON', () => ({
    useOrgUnitTileJSONs: mockUseOrgUnitTileJSONs,
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

const renderMap = (searches: Search[], clusters = true) =>
    renderWithThemeAndIntlProvider(
        <OrgUnitsSearchMapLibre
            searches={searches}
            getSearchColor={index => colors[index]}
            clusters={clusters}
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
            '#111111',
            '#333333',
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
        fireEvent.click(screen.getByText('Show all'));
        expect(mapProps.current?.bounds).toEqual([
            [-6, -13],
            [31, 50],
        ]);
    });

    it('says which filters the map cannot apply', () => {
        renderMap([{ hasInstances: 'duplicates' }, {}]);
        expect(
            screen.getByText('Not applied on this map: hasInstances'),
        ).toBeInTheDocument();
    });
});
