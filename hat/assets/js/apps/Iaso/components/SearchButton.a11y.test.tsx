import React from 'react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { SearchButton } from 'Iaso/components/SearchButton';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';

describe('SearchButton accessibility', () => {
    it('has no accessibility violation when enabled', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SearchButton disabled={false} onSearch={() => {}} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('has no accessibility violation when disabled', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SearchButton disabled={true} onSearch={() => {}} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
