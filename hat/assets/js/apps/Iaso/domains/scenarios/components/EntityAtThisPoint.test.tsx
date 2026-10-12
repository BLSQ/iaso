import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { EntityAtThisPoint } from './EntityAtThisPoint';

const before = {
    qr_code: 'CARD-0001',
    cycle_1_rempli: '0',
    cycle_2_rempli: '0',
};

const renderPanel = (after?: Record<string, unknown>) =>
    renderWithThemeAndIntlProvider(
        <EntityAtThisPoint
            entityType="Enfant CPS 2026"
            before={before}
            after={after}
            forms={{}}
            referenceFormId="registration"
            mainFields={['qr_code']}
            showTechnicalNames
        />,
    );

describe('EntityAtThisPoint', () => {
    it('shows the main and changed fields, the others on demand', async () => {
        renderPanel({ ...before, cycle_1_rempli: 'cycle_rempli' });

        expect(screen.getByText('qr_code')).toBeInTheDocument();
        expect(screen.getByText('cycle_1_rempli')).toBeInTheDocument();
        expect(screen.queryByText('cycle_2_rempli')).toBeNull();

        await userEvent.click(
            screen.getByRole('button', { name: 'Show all 3 fields' }),
        );
        expect(screen.getByText('cycle_2_rempli')).toBeInTheDocument();

        await userEvent.click(
            screen.getByRole('button', {
                name: 'Show only the main and changed fields',
            }),
        );
        expect(screen.queryByText('cycle_2_rempli')).toBeNull();
    });

    it('has no toggle when every field is shown already', () => {
        renderWithThemeAndIntlProvider(
            <EntityAtThisPoint
                entityType="Enfant CPS 2026"
                before={{ qr_code: 'CARD-0001' }}
                forms={{}}
                referenceFormId="registration"
                mainFields={['qr_code']}
                showTechnicalNames
            />,
        );

        expect(screen.queryByRole('button')).toBeNull();
    });
});
