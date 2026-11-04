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

        const chip = screen.getByTestId('validation-status-chip');
        expect(chip).toHaveStyle({
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50',
        });
        expect(screen.getByText('Approved')).toHaveStyle({
            color: 'rgb(46, 105, 48)',
        });
    });

    it('renders REJECTED with error color', () => {
        renderWithThemeAndIntlProvider(<StatusChip status="REJECTED" />);

        const chip = screen.getByTestId('validation-status-chip');
        expect(chip).toHaveStyle({
            backgroundColor: 'rgba(215, 25, 28, 0.2)',
            borderColor: 'rgb(215, 25, 28)',
        });
        expect(screen.getByText('Rejected')).toHaveStyle({
            color: 'rgb(129, 15, 17)',
        });
    });

    it('renders PENDING with primary color', () => {
        renderWithThemeAndIntlProvider(<StatusChip status="PENDING" />);

        const chip = screen.getByTestId('validation-status-chip');
        expect(chip).toHaveStyle({
            backgroundColor: 'rgba(0, 102, 153, 0.2)',
            borderColor: '#006699',
        });
        expect(screen.getByText('Pending')).toHaveStyle({
            color: 'rgb(0, 61, 92)',
        });
    });

    it('renders any other option with primary color', () => {
        // @ts-ignore
        const word = faker.word.noun();
        // @ts-ignore
        renderWithThemeAndIntlProvider(<StatusChip status={word} />);

        const chip = screen.getByTestId('validation-status-chip');
        expect(chip).toHaveStyle({
            backgroundColor: 'rgba(0, 102, 153, 0.2)',
            borderColor: '#006699',
        });
        expect(screen.getByText(word)).toBeInTheDocument();
    });
});
