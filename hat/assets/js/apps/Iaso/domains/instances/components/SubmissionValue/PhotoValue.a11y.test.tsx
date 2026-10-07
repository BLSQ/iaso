import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { PhotoValue } from './PhotoValue';
import { makeField } from './testUtils';

describe('PhotoValue a11y', () => {
    it('empty state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <PhotoValue
                field={makeField({
                    kind: 'photo',
                    rawValue: 'missing.jpg',
                    empty: true,
                })}
                files={[]}
            />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('image state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <PhotoValue
                field={makeField({
                    kind: 'photo',
                    id: 'facility_photo',
                    rawValue: 'facility.jpg',
                    empty: false,
                })}
                files={['/media/uploads/facility.jpg']}
            />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
