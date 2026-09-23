import React from 'react';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { RailRow } from './RailRow';

describe('RailRow', () => {
    it('renders the label and collapsed state', () => {
        renderWithThemeAndIntlProvider(
            <RailRow
                icon={<PlaceOutlinedIcon fontSize="small" />}
                label="Location"
                state="Kinshasa"
            >
                <div>Location details</div>
            </RailRow>,
        );
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Kinshasa')).toBeInTheDocument();
        expect(screen.getByText('Location details')).not.toBeVisible();
    });

    it('expands to show children when clicked', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <RailRow
                icon={<PlaceOutlinedIcon fontSize="small" />}
                label="Location"
                state="Kinshasa"
            >
                <div>Location details</div>
            </RailRow>,
        );

        await user.click(screen.getByText('Location'));
        expect(screen.getByText('Location details')).toBeInTheDocument();
    });

    it('renders expanded by default when requested', () => {
        renderWithThemeAndIntlProvider(
            <RailRow
                icon={<PlaceOutlinedIcon fontSize="small" />}
                label="Location"
                defaultExpanded
            >
                <div>Location details</div>
            </RailRow>,
        );
        expect(screen.getByText('Location details')).toBeInTheDocument();
    });
});
