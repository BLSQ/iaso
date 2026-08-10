import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
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

describe('GpsField a11y', () => {
    it('collapsed state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <GpsField point={point} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('expanded state has no accessibility violations', async () => {
        const user = userEvent.setup();
        const { container } = renderWithThemeAndIntlProvider(
            <GpsField point={point} />,
        );
        await user.click(
            screen.getByRole('button', { name: 'Show exact values' }),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
