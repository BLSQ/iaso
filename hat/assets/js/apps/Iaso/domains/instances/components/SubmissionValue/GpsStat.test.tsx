import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { GpsStat } from './GpsStat';

describe('GpsStat', () => {
    it('renders the label and value', () => {
        renderWithThemeAndIntlProvider(
            <GpsStat label="Latitude" value="1.234" />,
        );
        expect(screen.getByText('Latitude')).toBeInTheDocument();
        expect(screen.getByText('1.234')).toBeInTheDocument();
    });
});
