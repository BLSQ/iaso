import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';
import { PiiRestrictedBanner } from './PiiRestrictedBanner';

const { mockCurrentUser } = vi.hoisted(() => ({ mockCurrentUser: vi.fn() }));

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

const banner = () => screen.queryByTestId('pii-restricted-banner');

describe('PiiRestrictedBanner', () => {
    it('is shown when personal data is hidden from the user', () => {
        mockCurrentUser.mockReturnValue({ pii_restricted: true });
        renderWithThemeAndIntlProvider(<PiiRestrictedBanner />);
        expect(banner()).toBeInTheDocument();
        expect(banner()).toHaveTextContent('Some information is hidden');
    });

    it('is not shown when the user can see all the data', () => {
        mockCurrentUser.mockReturnValue({ pii_restricted: false });
        renderWithThemeAndIntlProvider(<PiiRestrictedBanner />);
        expect(banner()).not.toBeInTheDocument();
    });

    it('is not shown before the current user is loaded', () => {
        mockCurrentUser.mockReturnValue(undefined);
        renderWithThemeAndIntlProvider(<PiiRestrictedBanner />);
        expect(banner()).not.toBeInTheDocument();
    });

    it('follows `show` when the page knows whether data is hidden', () => {
        mockCurrentUser.mockReturnValue({ pii_restricted: true });
        const { rerender } = renderWithThemeAndIntlProvider(
            <PiiRestrictedBanner show={false} />,
        );
        expect(banner()).not.toBeInTheDocument();

        mockCurrentUser.mockReturnValue({ pii_restricted: false });
        rerender(<PiiRestrictedBanner show />);
        expect(banner()).toBeInTheDocument();
    });
});
