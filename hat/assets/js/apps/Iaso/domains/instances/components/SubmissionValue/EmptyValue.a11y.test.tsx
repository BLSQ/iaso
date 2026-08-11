import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EmptyValue } from './EmptyValue';

describe('EmptyValue a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(<EmptyValue />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
