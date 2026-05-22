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

        expect(
            screen.getByText(/ada \(Ada Lovelace\)/i),
        ).toBeVisible();
    });

    it('uses white label text on a dark background color', () => {
        renderWithTheme(
            <UserChip
                user={{
                    username: 'u1',
                    color: '#111111',
                }}
            />,
        );

        const chip = screen.getByText('u1').closest('.MuiChip-root');
        expect(chip).toBeTruthy();
        expect(chip).toHaveStyle({ color: 'rgb(255, 255, 255)' });
        expect(chip).toHaveStyle({ backgroundColor: 'rgb(17, 17, 17)' });
    });

    it('uses dark label text on a light background color', () => {
        renderWithTheme(
            <UserChip
                user={{
                    username: 'u2',
                    color: '#f5f5f5',
                }}
            />,
        );

        const chip = screen.getByText('u2').closest('.MuiChip-root');
        expect(chip).toBeTruthy();
        expect(chip).toHaveStyle({ color: 'rgb(0, 0, 0)' });
    });
});
