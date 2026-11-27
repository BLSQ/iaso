import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { QueueTiles } from './QueueTiles';

const counts = {
    all: 181,
    awaiting_my_action: 12,
    awaiting_others: 34,
    handled_by_me: 128,
    rejected: 7,
    oldest_pending_since: null,
};

describe('QueueTiles', () => {
    it('shows the count of each queue', () => {
        renderWithThemeAndIntlProvider(
            <QueueTiles counts={counts} onChange={vi.fn()} />,
        );
        expect(screen.getByTestId('queue-tile-all')).toHaveTextContent(
            'All181',
        );
        expect(
            screen.getByTestId('queue-tile-awaiting_my_action'),
        ).toHaveTextContent('Awaiting my action12');
        expect(
            screen.getByTestId('queue-tile-awaiting_others'),
        ).toHaveTextContent('Awaiting others34');
        expect(
            screen.getByTestId('queue-tile-handled_by_me'),
        ).toHaveTextContent('Handled by me128');
        expect(screen.getByTestId('queue-tile-rejected')).toHaveTextContent(
            'Rejected7',
        );
    });

    it('selects "All" when no queue is selected', () => {
        renderWithThemeAndIntlProvider(
            <QueueTiles counts={counts} onChange={vi.fn()} />,
        );
        expect(screen.getByTestId('queue-tile-all')).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(
            screen.getByTestId('queue-tile-awaiting_my_action'),
        ).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onChange with the clicked queue', async () => {
        const onChange = vi.fn();
        renderWithThemeAndIntlProvider(
            <QueueTiles
                counts={counts}
                selectedQueue="rejected"
                onChange={onChange}
            />,
        );
        expect(screen.getByTestId('queue-tile-rejected')).toHaveAttribute(
            'aria-selected',
            'true',
        );

        await userEvent.click(
            screen.getByTestId('queue-tile-awaiting_my_action'),
        );
        expect(onChange).toHaveBeenLastCalledWith('awaiting_my_action');

        await userEvent.click(screen.getByTestId('queue-tile-all'));
        expect(onChange).toHaveBeenLastCalledWith(undefined);
    });

    it('does not show counts while loading', () => {
        renderWithThemeAndIntlProvider(
            <QueueTiles isLoading onChange={vi.fn()} />,
        );
        expect(screen.getByTestId('queue-tile-all')).toHaveTextContent('All');
        expect(screen.queryByText('181')).not.toBeInTheDocument();
    });
});
