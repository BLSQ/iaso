import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import tiles from 'Iaso/constants/mapTiles';
import { OrgUnitTypeHierarchyDropdownValue } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MapTools } from './MapTools';

vi.mock('./MapLegend', () => ({
    MapLegend: () => <div data-testid="map-legend" />,
}));

vi.mock('Iaso/utils/map/mapUtils', () => ({
    CloseTooltipOnMoveStart: () => <div data-testid="close-tooltip" />,
}));

vi.mock('Iaso/components/maps/tools/CustomZoomControl', () => ({
    CustomZoomControl: () => <div data-testid="zoom-control" />,
}));

vi.mock('Iaso/components/maps/tools/CustomTileLayer', () => ({
    CustomTileLayer: () => <div data-testid="tile-layer" />,
}));

vi.mock('react-leaflet', () => ({
    ScaleControl: () => <div data-testid="scale-control" />,
}));

const planning = {
    id: 42,
    name: 'Planning',
    target_org_unit_type_details: [{ id: 2, name: 'Area' }],
} as any;

const orgUniTypeList: OrgUnitTypeHierarchyDropdownValue[] = [
    {
        value: 2,
        label: 'Area',
        original: {
            id: 2,
            name: 'Area',
            short_name: 'Area',
            depth: 1,
            category: 'admin',
            sub_unit_types: [],
        },
    },
];

describe('MapTools', () => {
    it('renders map controls and the legend when planning data is available', () => {
        renderWithThemeAndIntlProvider(
            <MapTools
                orgUniTypeList={orgUniTypeList}
                planning={planning}
                selectedOrgUnitTypes={orgUniTypeList}
                setSelectedOrgUnitTypes={vi.fn()}
                bounds={undefined}
                currentTile={tiles.osm}
                setCurrentTile={vi.fn()}
                boundsOptions={{}}
            />,
        );

        expect(screen.getByTestId('map-legend')).toBeInTheDocument();
        expect(screen.getByTestId('close-tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
        expect(screen.getByTestId('scale-control')).toBeInTheDocument();
        expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });

    it('does not render the legend when org unit types or planning are missing', () => {
        renderWithThemeAndIntlProvider(
            <MapTools
                selectedOrgUnitTypes={[]}
                setSelectedOrgUnitTypes={vi.fn()}
                currentTile={tiles.osm}
                setCurrentTile={vi.fn()}
                boundsOptions={{}}
            />,
        );

        expect(screen.queryByTestId('map-legend')).toBeNull();
        expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
    });
});
