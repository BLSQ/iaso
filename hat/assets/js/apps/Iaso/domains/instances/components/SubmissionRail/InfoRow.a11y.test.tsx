import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { ActivityRow, InfoRow, KvRow } from './InfoRow';

describe('InfoRow a11y', () => {
    it('InfoRow has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <InfoRow label="Form">Facility survey</InfoRow>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('ActivityRow has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <ActivityRow label="Updated" who="Ada" when="01/01/2024 12:00" />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('KvRow has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <KvRow label="District" value="Kinshasa" />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
