import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('Iaso/api/reports', () => ({
    useApiReportsCreate: vi.fn(),
    useApiReportsVersionsCreate: vi.fn(),
}));

// The drop zone is not usable in jsdom: a button selects the file instead.
vi.mock('bluesquare-components', async importOriginal => ({
    ...(await importOriginal<typeof import('bluesquare-components')>()),
    FilesUpload: ({
        onFilesSelect,
    }: {
        onFilesSelect: (f: File[]) => void;
    }) => (
        <button
            type="button"
            onClick={() =>
                onFilesSelect([
                    new File(['zip'], 'progress.zip', {
                        type: 'application/zip',
                    }),
                ])
            }
        >
            select file
        </button>
    ),
}));

import {
    useApiReportsCreate,
    useApiReportsVersionsCreate,
} from 'Iaso/api/reports';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MobileReportUploadForm } from './MobileReportUploadForm';

const createReport = vi.fn();
const createVersion = vi.fn();

const report = {
    id: 3,
    name: 'Campaign progress',
    project: 7,
    published_version: 'v1',
    published_version_id: 11,
    url: null,
    status: 'published',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
};

describe('MobileReportUploadForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useApiReportsCreate).mockReturnValue({
            mutate: createReport,
            isLoading: false,
        } as any);
        vi.mocked(useApiReportsVersionsCreate).mockReturnValue({
            mutate: createVersion,
            isLoading: false,
        } as any);
    });

    it('creates the report of the project with the first upload', () => {
        renderWithThemeAndIntlProvider(
            <MobileReportUploadForm projectId={7} />,
        );
        fireEvent.click(screen.getByText('select file'));
        fireEvent.click(screen.getByTestId('mobile-report-upload'));

        expect(createReport).toHaveBeenCalledWith({
            data: {
                project: 7,
                name: 'progress.zip',
                file: expect.any(File),
                version_name: 'progress.zip',
            },
        });
        expect(createVersion).not.toHaveBeenCalled();
        // Errors show the API message (e.g. no index.html at the root of the zip).
        expect(useApiReportsCreate).toHaveBeenCalledWith({
            mutation: expect.objectContaining({
                meta: { useApiErrorMessage: true },
            }),
        });
    });

    it('adds a version to an existing report', () => {
        renderWithThemeAndIntlProvider(
            <MobileReportUploadForm projectId={7} report={report} />,
        );
        fireEvent.click(screen.getByText('select file'));
        fireEvent.click(screen.getByTestId('mobile-report-upload'));

        expect(createVersion).toHaveBeenCalledWith({
            id: '3',
            data: {
                file: expect.any(File),
                name: 'progress.zip',
                publish: true,
            },
        });
        expect(createReport).not.toHaveBeenCalled();
    });
});
