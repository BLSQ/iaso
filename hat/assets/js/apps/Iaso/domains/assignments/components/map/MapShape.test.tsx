import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MapShape } from './MapShape';

const captureGeoJsonProps = vi.fn();

vi.mock('react-leaflet', () => ({
    GeoJSON: ({
        onEachFeature,
        data,
    }: {
        onEachFeature?: (
            feature: unknown,
            layer: { on: (event: string, handler: () => void) => void },
        ) => void;
        data: unknown;
    }) => {
        captureGeoJsonProps({ onEachFeature, data });
        return <div data-testid="map-shape" />;
    },
}));

const orgUnitWithShape = {
    id: 8,
    name: 'District',
    geo_json: { type: 'Polygon', coordinates: [] },
    has_geo_json: true,
    latitude: 0,
    longitude: 0,
    org_unit_type_id: 1,
} as PlanningOrgUnits;

describe('MapShape', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when the org unit has no geo_json', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <MapShape
                ou={{ ...orgUnitWithShape, geo_json: undefined }}
                canAssign
                handleClick={vi.fn()}
                getAssignmentColor={() => '#00ff00'}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('renders a GeoJSON layer when geo_json is present', () => {
        renderWithThemeAndIntlProvider(
            <MapShape
                ou={orgUnitWithShape}
                canAssign
                handleClick={vi.fn()}
                getAssignmentColor={() => '#00ff00'}
            />,
        );

        expect(screen.getByTestId('map-shape')).toBeInTheDocument();
        expect(captureGeoJsonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                data: orgUnitWithShape.geo_json,
            }),
        );
    });

    it('triggers save on layer click when assignment is allowed', () => {
        const handleClick = vi.fn();

        renderWithThemeAndIntlProvider(
            <MapShape
                ou={orgUnitWithShape}
                canAssign
                handleClick={handleClick}
                getAssignmentColor={() => '#00ff00'}
            />,
        );

        const { onEachFeature } = captureGeoJsonProps.mock.calls[0][0];
        const layer = { on: vi.fn() };
        onEachFeature({}, layer);
        const clickHandler = layer.on.mock.calls[0][1];
        clickHandler();

        expect(handleClick).toHaveBeenCalledWith(8);
    });

    it('does not trigger save on layer click when assignment is not allowed', () => {
        const handleClick = vi.fn();

        renderWithThemeAndIntlProvider(
            <MapShape
                ou={orgUnitWithShape}
                canAssign={false}
                handleClick={handleClick}
                getAssignmentColor={() => '#00ff00'}
            />,
        );

        const { onEachFeature } = captureGeoJsonProps.mock.calls[0][0];
        const layer = { on: vi.fn() };
        onEachFeature({}, layer);
        const clickHandler = layer.on.mock.calls[0][1];
        clickHandler();

        expect(handleClick).not.toHaveBeenCalled();
    });
});
