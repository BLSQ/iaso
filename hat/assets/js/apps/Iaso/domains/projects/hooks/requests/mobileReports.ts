import { UseMutationResult, UseQueryResult } from 'react-query';
import { getRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation, useSnackQuery } from '../../../../libs/apiHooks';
import { MobileReport, MobileReportVersion } from '../../types/mobileReport';

const REPORTS_QUERY_KEY = 'project-mobile-report';
const VERSIONS_QUERY_KEY = 'project-mobile-report-versions';

export const useGetProjectMobileReport = (
    projectId?: number | string | null,
): UseQueryResult<MobileReport | undefined, Error> =>
    useSnackQuery({
        queryKey: [REPORTS_QUERY_KEY, projectId],
        queryFn: () => getRequest(`/api/reports/?project=${projectId}`),
        options: {
            enabled: Boolean(projectId),
            select: (data: MobileReport[]) => data?.[0],
        },
    });

export const useGetMobileReportVersions = (
    reportId?: number,
): UseQueryResult<MobileReportVersion[], Error> =>
    useSnackQuery({
        queryKey: [VERSIONS_QUERY_KEY, reportId],
        queryFn: () => getRequest(`/api/reports/${reportId}/versions/`),
        options: { enabled: Boolean(reportId) },
    });

export type UploadMobileReportArgs = {
    projectId: number | string;
    reportId?: number;
    file: File;
    name?: string;
    versionName?: string;
    publish: boolean;
};

// A project has at most one report: the first upload creates it, the next ones add versions.
export const uploadMobileReport = ({
    projectId,
    reportId,
    file,
    name,
    versionName,
    publish,
}: UploadMobileReportArgs): Promise<unknown> => {
    if (reportId) {
        return postRequest({
            url: `/api/reports/${reportId}/versions/`,
            data: { name: versionName || file.name, publish },
            fileData: { file },
        });
    }
    return postRequest({
        url: '/api/reports/',
        data: {
            project: projectId,
            name: name || file.name,
            version_name: versionName || file.name,
        },
        fileData: { file },
    });
};

export const useUploadMobileReport = (): UseMutationResult<
    unknown,
    unknown,
    UploadMobileReportArgs
> =>
    useSnackMutation({
        mutationFn: uploadMobileReport,
        invalidateQueryKey: [REPORTS_QUERY_KEY, VERSIONS_QUERY_KEY],
        // Shows why the zip was refused (no index.html at the root, not a zip...).
        useApiErrorMessage: true,
    });

export const usePublishMobileReportVersion = (): UseMutationResult<
    unknown,
    unknown,
    { reportId: number; versionId: number }
> =>
    useSnackMutation({
        mutationFn: ({ reportId, versionId }) =>
            postRequest(`/api/reports/${reportId}/publish/`, {
                version_id: versionId,
            }),
        invalidateQueryKey: [REPORTS_QUERY_KEY, VERSIONS_QUERY_KEY],
    });
