import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../../../../tests/helpers';
import { UserChip } from './UserChip';

describe('UserChip', () => {
    it('renders the display name from the user profile', () => {
        renderWithTheme(
            <UserChip
                user={{
                    first_name: 'Ada',
                    last_name: 'Lovelace',
                    username: 'ada',
                    color: '#1a1a1a',
                }}
            />,
        );

        expect(screen.getByText(/ada \(Ada Lovelace\)/i)).toBeVisible();
    });

    it('applies outlined ColorChip styles for a dark user color', () => {
        renderWithTheme(
            <UserChip
                user={{
                    username: 'u1',
                    color: '#111111',
                }}
            />,
        );

        const label = screen.getByText('u1');
        const chip = label.closest('.MuiChip-root');
        expect(chip).toBeTruthy();
        expect(chip).toHaveStyle({
            backgroundColor: 'rgba(17, 17, 17, 0.2)',
            borderColor: '#111111',
        });
        // Ink lives on the inner label, not the Chip root
        expect(label).toHaveStyle({ color: 'rgb(10, 10, 10)' });
    });

    it('applies outlined ColorChip styles for a light user color', () => {
        renderWithTheme(
            <UserChip
                user={{
                    username: 'u2',
                    color: '#f5f5f5',
                }}
            />,
        );

        const label = screen.getByText('u2');
        const chip = label.closest('.MuiChip-root');
        expect(chip).toBeTruthy();
        expect(chip).toHaveStyle({
            backgroundColor: 'rgba(245, 245, 245, 0.2)',
            borderColor: '#f5f5f5',
        });
        expect(label).toHaveStyle({ color: 'rgb(147, 147, 147)' });
    });
});
