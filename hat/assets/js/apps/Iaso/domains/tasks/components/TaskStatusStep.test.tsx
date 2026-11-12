import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import moment from 'moment';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    renderWithThemeAndIntlProvider,
    setLocale,
} from '../../../../../tests/helpers';
import { Task } from '../types';
import { TaskStatusStep } from './TaskStatusStep';

const { mockPatchRequest } = vi.hoisted(() => ({
    mockPatchRequest: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: vi.fn(),
    patchRequest: (...args: unknown[]) => mockPatchRequest(...args),
}));

const makeTask = (overrides: Partial<Task<unknown>> = {}): Task<unknown> => ({
    id: 31,
    name: 'org_unit_bulk_update',
    created_at: moment().unix(),
    started_at: moment().unix(),
    ended_at: null,
    progress_value: 420,
    end_value: 610,
    launcher: { first_name: '', last_name: '', username: 'bswfynk' },
    result: null,
    status: 'RUNNING',
    should_be_killed: false,
    progress_message: '420 modified',
    ...overrides,
});

describe('TaskStatusStep', () => {
    beforeEach(() => {
        setLocale('en');
        mockPatchRequest.mockReset();
        mockPatchRequest.mockResolvedValue({});
    });

    it('shows the progress of a running task', () => {
        renderWithThemeAndIntlProvider(<TaskStatusStep task={makeTask()} />);

        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('420 / 610')).toBeInTheDocument();
        expect(screen.getByText('69 %')).toBeInTheDocument();
    });

    it('asks for confirmation before stopping a task', async () => {
        renderWithThemeAndIntlProvider(<TaskStatusStep task={makeTask()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

        expect(
            await screen.findByText('Stop org_unit_bulk_update?'),
        ).toBeInTheDocument();
        expect(mockPatchRequest).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Stop task' }));

        await waitFor(() =>
            expect(mockPatchRequest).toHaveBeenCalledWith('/api/tasks/31/', {
                id: 31,
                should_be_killed: true,
            }),
        );
    });

    it('offers to relaunch a failed task, and shows the progress it reached', () => {
        renderWithThemeAndIntlProvider(
            <TaskStatusStep
                task={makeTask({
                    status: 'ERRORED',
                    progress_value: 137,
                    end_value: 250,
                    ended_at: moment().unix(),
                })}
            />,
        );

        expect(screen.getByText('Failed')).toBeInTheDocument();
        expect(screen.getByText('137 / 250')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Relaunch' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull();
    });

    it('shows a finished task as complete even if it stopped reporting progress early', () => {
        renderWithThemeAndIntlProvider(
            <TaskStatusStep
                task={makeTask({
                    status: 'SUCCESS',
                    progress_value: 80,
                    end_value: 100,
                    ended_at: moment().unix(),
                })}
            />,
        );

        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('100 / 100')).toBeInTheDocument();
        expect(screen.getByText('100 %')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('ignores the progress of a previous run while queued', () => {
        renderWithThemeAndIntlProvider(
            <TaskStatusStep
                task={makeTask({
                    status: 'QUEUED',
                    progress_value: 137,
                    end_value: 250,
                })}
            />,
        );

        expect(screen.getByText('Waiting for a worker')).toBeInTheDocument();
        expect(screen.queryByText('137 / 250')).toBeNull();
    });
});
