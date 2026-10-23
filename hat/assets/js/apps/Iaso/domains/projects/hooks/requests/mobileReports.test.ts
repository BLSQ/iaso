import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../libs/Api', () => ({
    getRequest: vi.fn(),
    postRequest: vi.fn(() => Promise.resolve({})),
}));

import { postRequest } from '../../../../libs/Api';
import { uploadMobileReport } from './mobileReports';

describe('uploadMobileReport', () => {
    const file = new File(['zip'], 'progress.zip', { type: 'application/zip' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates the report of the project when it has none', async () => {
        await uploadMobileReport({
            projectId: 7,
            file,
            name: 'Progress',
            versionName: 'v1',
            publish: true,
        });
        expect(postRequest).toHaveBeenCalledWith({
            url: '/api/reports/',
            data: { project: 7, name: 'Progress', version_name: 'v1' },
            fileData: { file },
        });
    });

    it('adds a version to the existing report', async () => {
        await uploadMobileReport({
            projectId: 7,
            reportId: 3,
            file,
            publish: false,
        });
        expect(postRequest).toHaveBeenCalledWith({
            url: '/api/reports/3/versions/',
            data: { name: 'progress.zip', publish: false },
            fileData: { file },
        });
    });
});
