import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EmptyValue } from './EmptyValue';

describe('EmptyValue', () => {
    it('renders the text placeholder', () => {
        renderWithThemeAndIntlProvider(<EmptyValue />);
        expect(screen.getByText('--')).toBeInTheDocument();
    });
});
