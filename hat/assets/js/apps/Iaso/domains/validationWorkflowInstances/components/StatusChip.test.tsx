import React from 'react';
import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

vi.mock('@mui/material', () => ({
    Chip: ({ color, label }: { color: string; label: string }) => (
        <div data-testid="chip" data-color={color}>
            {label}
        </div>
    ),
}));

describe('StatusChip', () => {
    it('renders APPROVED with success color', () => {
        render(<StatusChip status="APPROVED" />);

        expect(screen.getByTestId('chip')).toHaveAttribute(
            'data-color',
            'success',
        );
        expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });

    it('renders REJECTED with error color', () => {
        render(<StatusChip status="REJECTED" />);

        expect(screen.getByTestId('chip')).toHaveAttribute(
            'data-color',
            'error',
        );
        expect(screen.getByText('REJECTED')).toBeInTheDocument();
    });

    it('renders PENDING with primary color', () => {
        render(<StatusChip status="PENDING" />);

        expect(screen.getByTestId('chip')).toHaveAttribute(
            'data-color',
            'primary',
        );
        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('renders any other option with primary color', () => {
        // @ts-ignore
        const word = faker.word.noun();
        render(<StatusChip status={word} />);

        expect(screen.getByTestId('chip')).toHaveAttribute(
            'data-color',
            'primary',
        );
        expect(screen.getByText(word)).toBeInTheDocument();
    });
});
