import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { GpsField } from './GpsField';

vi.mock('Iaso/components/maps/MarkerMapComponent', () => ({
    MarkerMap: () => <div data-testid="marker-map" />,
}));

const point = {
    latitude: 1.23,
    longitude: 4.56,
    altitude: 100,
    accuracy: 5,
};

describe('GpsField', () => {
    it('renders the map and a button to reveal exact values', () => {
        renderWithThemeAndIntlProvider(<GpsField point={point} />);
        expect(screen.getByTestId('marker-map')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Show exact values' }),
        ).toBeInTheDocument();
        expect(screen.queryByText('Latitude')).not.toBeInTheDocument();
    });

    it('toggles exact coordinate stats when the button is clicked', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<GpsField point={point} />);

        await user.click(
            screen.getByRole('button', { name: 'Show exact values' }),
        );

        expect(screen.getByText('Latitude')).toBeInTheDocument();
        expect(screen.getByText('1.23')).toBeInTheDocument();
        expect(screen.getByText('Longitude')).toBeInTheDocument();
        expect(screen.getByText('4.56')).toBeInTheDocument();
        expect(screen.getByText('Altitude')).toBeInTheDocument();
        expect(screen.getByText('100 m')).toBeInTheDocument();
        expect(screen.getByText('Accuracy')).toBeInTheDocument();
        expect(screen.getByText('±5 m')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Hide exact values' }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Hide exact values' }),
        );
        await waitFor(() => {
            expect(screen.queryByText('Latitude')).not.toBeInTheDocument();
        });
    });

    it('omits altitude and accuracy when they are missing', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <GpsField point={{ latitude: 1, longitude: 2 }} />,
        );

        await user.click(
            screen.getByRole('button', { name: 'Show exact values' }),
        );

        expect(screen.getByText('Latitude')).toBeInTheDocument();
        expect(screen.queryByText('Altitude')).not.toBeInTheDocument();
        expect(screen.queryByText('Accuracy')).not.toBeInTheDocument();
    });
});
