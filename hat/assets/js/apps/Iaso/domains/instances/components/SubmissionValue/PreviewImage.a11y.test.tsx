import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { PreviewImage } from './PreviewImage';

describe('PreviewImage a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <PreviewImage url="/media/photo.jpg" alt="facility_photo" />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
