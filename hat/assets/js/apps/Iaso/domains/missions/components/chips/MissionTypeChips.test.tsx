import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EntityAndFormChip } from './EntityAndFormChip';
import { FormsChip } from './FormsChip';
import { OrgUnitAndFormChip } from './OrgUnitAndFormChip';

describe('Mission type chips', () => {
    it('renders FormsChip with form label', () => {
        renderWithThemeAndIntlProvider(<FormsChip />);
        expect(screen.getByText('Form')).toBeInTheDocument();
    });

    it('renders OrgUnitAndFormChip with org unit + form label', () => {
        renderWithThemeAndIntlProvider(<OrgUnitAndFormChip />);
        expect(screen.getByText('Org unit + Form')).toBeInTheDocument();
    });

    it('renders EntityAndFormChip with entity + form label', () => {
        renderWithThemeAndIntlProvider(<EntityAndFormChip />);
        expect(screen.getByText('Entity + Form')).toBeInTheDocument();
    });
});
