import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import moment from 'moment';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    renderWithThemeAndIntlProvider,
    setLocale,
} from '../../../../../tests/helpers';
import { Task } from '../types';
import { TaskBaseInfo } from './TaskBaseInfo';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: (...args: unknown[]) => mockGetRequest(...args),
}));

const PRESIGNED_URL = 'https://s3.example.com/export.zip?signature=abc';

let nextTaskId = 1;

const makeTask = (result: Record<string, unknown>): Task<any> => ({
    id: nextTaskId++, // the presigned URL query is cached per task id
    name: 'superset_export',
    created_at: moment().unix(),
    started_at: moment().unix(),
    ended_at: moment().unix(),
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
        setLocale('en');
        mockGetRequest.mockReset();
        mockGetRequest.mockResolvedValue({ presigned_url: PRESIGNED_URL });
    });

    it('shows when a file will expire and allows downloading it', async () => {
        const expiresAt = moment().add(3, 'days');
        const task = makeTask({
            result: 'SUCCESS',
            data: { file: 'export.zip', expires_at: expiresAt.toISOString() },
        });

        renderWithThemeAndIntlProvider(<TaskBaseInfo task={task} />);

        expect(screen.getByText('File available until')).toBeInTheDocument();
        expect(
            screen.getByText(`${expiresAt.format('LTS')} (in 3 days)`),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('link', { name: 'Download file' }),
        ).toHaveAttribute('href', PRESIGNED_URL);
        expect(mockGetRequest).toHaveBeenCalledWith(
            `/api/tasks/${task.id}/presigned-url/`,
        );
    });

    it('disables the download of an expired file', () => {
        const expiresAt = moment().subtract(2, 'days');
        const task = makeTask({
            result: 'SUCCESS',
            data: { file: 'export.zip', expires_at: expiresAt.toISOString() },
        });

        renderWithThemeAndIntlProvider(<TaskBaseInfo task={task} />);

        expect(
            screen.getByText(`Expired on ${expiresAt.format('LTS')}`),
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
        await waitFor(() =>
            expect(
                screen.getByRole('link', { name: 'Download file' }),
            ).toHaveAttribute('href', PRESIGNED_URL),
        );
    });
});
