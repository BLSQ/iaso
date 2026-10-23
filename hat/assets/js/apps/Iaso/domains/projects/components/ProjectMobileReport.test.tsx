import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../hooks/requests/mobileReports', () => ({
    useGetProjectMobileReport: vi.fn(),
    useGetMobileReportVersions: vi.fn(),
    useUploadMobileReport: vi.fn(),
    usePublishMobileReportVersion: vi.fn(),
}));

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import {
    useGetMobileReportVersions,
    useGetProjectMobileReport,
    usePublishMobileReportVersion,
    useUploadMobileReport,
} from '../hooks/requests/mobileReports';
import { ProjectMobileReport } from './ProjectMobileReport';

const report = {
    id: 3,
    name: 'Campaign progress',
    project: 7,
    published_version: 'v2',
    published_version_id: 12,
    url: 'https://example.org/v2.zip',
    status: 'published',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
};

const versions = [
    {
        id: 12,
        name: 'v2',
        status: 'published',
        url: 'https://example.org/v2.zip',
        file_size: 1000,
        created_at: '2026-10-02T10:00:00Z',
        updated_at: '2026-10-02T10:00:00Z',
        created_by: 'admin',
    },
    {
        id: 11,
        name: 'v1',
        status: 'unpublished',
        url: 'https://example.org/v1.zip',
        file_size: 900,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        created_by: 'admin',
    },
];

const publish = vi.fn();

const mockHooks = (withReport: boolean) => {
    vi.mocked(useGetProjectMobileReport).mockReturnValue({
        data: withReport ? report : undefined,
        isFetching: false,
    } as any);
    vi.mocked(useGetMobileReportVersions).mockReturnValue({
        data: withReport ? versions : undefined,
        isFetching: false,
    } as any);
    vi.mocked(useUploadMobileReport).mockReturnValue({
        mutateAsync: vi.fn(() => Promise.resolve()),
        isLoading: false,
    } as any);
    vi.mocked(usePublishMobileReportVersion).mockReturnValue({
        mutate: publish,
        isLoading: false,
    } as any);
};

describe('ProjectMobileReport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('asks to save the project first when it is new', () => {
        mockHooks(false);
        renderWithThemeAndIntlProvider(
            <ProjectMobileReport projectId={null} hasReportsFeatureFlag />,
        );
        expect(
            screen.getByText(
                'Save the project before uploading a mobile report.',
            ),
        ).toBeInTheDocument();
    });

    it('offers to upload the first report when there is none', () => {
        mockHooks(false);
        renderWithThemeAndIntlProvider(
            <ProjectMobileReport projectId={7} hasReportsFeatureFlag />,
        );
        expect(
            screen.getByText('This project has no mobile report yet.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Upload a mobile report')).toBeInTheDocument();
        expect(screen.getByLabelText('Report name')).toBeInTheDocument();
        expect(screen.queryByText('Publish this version')).toBeNull();
        expect(screen.getByTestId('mobile-report-upload')).toBeDisabled();
    });

    it('warns when the project does not have the reports feature flag', () => {
        mockHooks(false);
        renderWithThemeAndIntlProvider(
            <ProjectMobileReport projectId={7} hasReportsFeatureFlag={false} />,
        );
        expect(
            screen.getByText(/feature flag/, { selector: 'div' }),
        ).toBeInTheDocument();
    });

    it('shows the versions and publishes an older one', () => {
        mockHooks(true);
        renderWithThemeAndIntlProvider(
            <ProjectMobileReport projectId={7} hasReportsFeatureFlag />,
        );
        expect(screen.getByText('Upload a new version')).toBeInTheDocument();
        expect(screen.getByText('Publish this version')).toBeInTheDocument();
        expect(screen.queryByLabelText('Report name')).toBeNull();

        const published = screen.getByTestId('mobile-report-version-12');
        expect(published).toHaveTextContent('Published');
        expect(published.querySelector('button')).toBeNull();

        const older = screen.getByTestId('mobile-report-version-11');
        expect(older).toHaveTextContent('Unpublished');
        fireEvent.click(older.querySelector('button') as HTMLElement);
        expect(publish).toHaveBeenCalledWith({ reportId: 3, versionId: 11 });
    });
});
