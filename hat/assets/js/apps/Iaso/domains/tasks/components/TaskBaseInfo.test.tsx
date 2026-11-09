import React from 'react';
import { screen } from '@testing-library/react';
import moment from 'moment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    renderWithThemeAndIntlProvider,
    setLocale,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { Task, TaskResult } from '../types';
import { TaskBaseInfo } from './TaskBaseInfo';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: (...args: unknown[]) => mockGetRequest(...args),
}));

const PRESIGNED_URL = 'https://s3.example.com/export.zip?signature=abc';
const NOW = new Date(2026, 9, 14, 10, 30);

const makeTask = (result: TaskResult): Task<TaskResult> => ({
    id: 1,
    name: 'superset_export',
    created_at: moment(NOW).unix(),
    started_at: moment(NOW).unix(),
    ended_at: moment(NOW).unix(),
    progress_value: 4,
    end_value: 4,
    launcher: { first_name: '', last_name: '', username: 'cron' },
    result,
    status: 'SUCCESS',
    should_be_killed: false,
    progress_message: 'Superset tables exported (224.7 MB)',
});

describe('TaskBaseInfo', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);
        setLocale('en');
        TestingQueryClient.clear();
        mockGetRequest.mockReset();
        mockGetRequest.mockResolvedValue({ presigned_url: PRESIGNED_URL });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows when a file will expire and allows downloading it', async () => {
        const task = makeTask({
            result: 'SUCCESS',
            data: {
                file: 'export.zip',
                expires_at: new Date(2026, 9, 17, 14, 0).toISOString(),
            },
        });

        renderWithThemeAndIntlProvider(<TaskBaseInfo task={task} />);

        expect(screen.getByText('File available until')).toBeInTheDocument();
        expect(
            screen.getByText('17/10/2026 14:00 (in 3 days)'),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('link', { name: 'Download file' }),
        ).toHaveAttribute('href', PRESIGNED_URL);
        expect(mockGetRequest).toHaveBeenCalledWith(
            `/api/tasks/${task.id}/presigned-url/`,
        );
    });

    it('disables the download of an expired file', () => {
        const task = makeTask({
            result: 'SUCCESS',
            data: {
                file: 'export.zip',
                expires_at: new Date(2026, 9, 12, 9, 0).toISOString(),
            },
        });

        renderWithThemeAndIntlProvider(<TaskBaseInfo task={task} />);

        expect(
            screen.getByText('Expired on 12/10/2026 09:00'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Download file' }),
        ).toBeDisabled();
        expect(mockGetRequest).not.toHaveBeenCalled();
    });

    it('does not show an expiry for files without one', async () => {
        const task = makeTask({ result: 'SUCCESS', data: 'file:export.zip' });

        renderWithThemeAndIntlProvider(<TaskBaseInfo task={task} />);

        expect(screen.queryByText('File available until')).toBeNull();
        expect(
            await screen.findByRole('link', { name: 'Download file' }),
        ).toHaveAttribute('href', PRESIGNED_URL);
    });

    it('does not offer a download when the result has no file', () => {
        const task = makeTask({
            result: 'SUCCESS',
            data: {
                expires_at: new Date(2026, 9, 17, 14, 0).toISOString(),
            } as TaskResult['data'],
        });

        renderWithThemeAndIntlProvider(<TaskBaseInfo task={task} />);

        expect(screen.queryByText('File available until')).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Download file' }),
        ).toBeNull();
        expect(mockGetRequest).not.toHaveBeenCalled();
    });
});
