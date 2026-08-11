import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { GpsStat } from './GpsStat';

describe('GpsStat a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <GpsStat label="Latitude" value="1.234" />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
