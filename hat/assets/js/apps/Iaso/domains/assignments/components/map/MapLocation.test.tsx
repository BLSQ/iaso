import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MapLocation } from './MapLocation';

const captureMarkerProps = vi.fn();

vi.mock('Iaso/components/maps/markers/CircleMarkerComponent', () => ({
    __esModule: true,
    default: ({
        onClick,
        item,
    }: {
        onClick: () => void;
        item: { id: number; name: string };
    }) => {
        captureMarkerProps({ onClick, item });
        return (
            <button type="button" onClick={onClick} data-testid="map-marker">
                {item.name}
            </button>
        );
    },
}));

const orgUnit = {
    id: 5,
    name: 'Health centre',
    latitude: 10,
    longitude: 20,
} as PlanningOrgUnits;

describe('MapLocation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls handleClick when clicked and assignment is allowed', () => {
        const handleClick = vi.fn();

        renderWithThemeAndIntlProvider(
            <MapLocation
                ou={orgUnit}
                canAssign
                handleClick={handleClick}
                getAssignmentColor={() => '#ff0000'}
            />,
        );

        fireEvent.click(screen.getByTestId('map-marker'));

        expect(handleClick).toHaveBeenCalledWith(5);
    });

    it('does not call handleClick when assignment is not allowed', () => {
        const handleClick = vi.fn();

        renderWithThemeAndIntlProvider(
            <MapLocation
                ou={orgUnit}
                canAssign={false}
                handleClick={handleClick}
                getAssignmentColor={() => '#ff0000'}
            />,
        );

        fireEvent.click(screen.getByTestId('map-marker'));

        expect(handleClick).not.toHaveBeenCalled();
    });
});
