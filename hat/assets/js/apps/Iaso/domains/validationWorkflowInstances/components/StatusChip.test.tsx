import React from 'react';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
    beforeAll(() => {
        faker.seed(1);
    });
    afterAll(() => {
        faker.seed(Date.now());
    });

    it('renders APPROVED with success color', () => {
        renderWithThemeAndIntlProvider(<StatusChip status="APPROVED" />);

        expect(screen.getByTestId('validation-status-chip')).toHaveClass(
            'MuiChip-colorSuccess',
        );
        expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('renders REJECTED with error color', () => {
        renderWithThemeAndIntlProvider(<StatusChip status="REJECTED" />);

        expect(screen.getByTestId('validation-status-chip')).toHaveClass(
            'MuiChip-colorError',
        );
        expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders PENDING with primary color', () => {
        renderWithThemeAndIntlProvider(<StatusChip status="PENDING" />);

        expect(screen.getByTestId('validation-status-chip')).toHaveClass(
            'MuiChip-colorPrimary',
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders any other option with primary color', () => {
        // @ts-ignore
        const word = faker.word.noun();
        renderWithThemeAndIntlProvider(<StatusChip status={word} />);

        expect(screen.getByTestId('validation-status-chip')).toHaveClass(
            'MuiChip-colorPrimary',
        );
        expect(screen.getByText(word)).toBeInTheDocument();
    });
});
