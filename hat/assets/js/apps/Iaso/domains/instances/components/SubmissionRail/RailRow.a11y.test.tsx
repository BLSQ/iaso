import React from 'react';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { RailRow } from './RailRow';

describe('RailRow a11y', () => {
    it('collapsed state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <RailRow
                icon={<PlaceOutlinedIcon fontSize="small" />}
                label="Location"
                state="Kinshasa"
                tone="info"
            >
                <div>Location details</div>
            </RailRow>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('expanded state has no accessibility violations', async () => {
        const user = userEvent.setup();
        const { container } = renderWithThemeAndIntlProvider(
            <RailRow
                icon={<PlaceOutlinedIcon fontSize="small" />}
                label="Location"
                state="Kinshasa"
            >
                <div>Location details</div>
            </RailRow>,
        );
        await user.click(screen.getByText('Location'));
        expect(await axe(container)).toHaveNoViolations();
    });
});
