import React from 'react';
import { screen } from '@testing-library/react';
import { textPlaceholder } from 'bluesquare-components';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import { PeriodTypeCell } from './PeriodTypeCell';

describe('PeriodTypeCell', () => {
    it('returns the placeholder when value is missing', () => {
        expect(PeriodTypeCell({ value: null })).toBe(textPlaceholder);
        expect(PeriodTypeCell({ value: undefined })).toBe(textPlaceholder);
        expect(PeriodTypeCell({ value: '' })).toBe(textPlaceholder);
    });

    it('returns the placeholder for an unknown period type', () => {
        expect(PeriodTypeCell({ value: 'NOT_A_PERIOD' })).toBe(textPlaceholder);
    });

    it('renders the translated label for a known period type', () => {
        renderWithThemeAndIntlProvider(<PeriodTypeCell value="MONTH" />);

        expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('renders the translated label for YEAR', () => {
        renderWithThemeAndIntlProvider(<PeriodTypeCell value="YEAR" />);

        expect(screen.getByText('Years')).toBeInTheDocument();
    });
});
