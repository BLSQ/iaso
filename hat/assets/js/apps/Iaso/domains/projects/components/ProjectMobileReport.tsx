import React, { FunctionComponent } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useApiReportsList, useApiReportsVersionsList } from 'Iaso/api/reports';
import MESSAGES from '../messages';
import { CurrentMobileReport } from './mobileReport/CurrentMobileReport';
import { MobileReportUploadForm } from './mobileReport/MobileReportUploadForm';
import { MobileReportVersionsTable } from './mobileReport/MobileReportVersionsTable';

type Props = {
    projectId?: number | string | null;
    hasReportsFeatureFlag: boolean;
};

export const ProjectMobileReport: FunctionComponent<Props> = ({
    projectId,
    hasReportsFeatureFlag,
}) => {
    const { formatMessage } = useSafeIntl();
    // A project has at most one report.
    const { data: reports, isFetching: isFetchingReport } = useApiReportsList(
        { project: Number(projectId), limit: 1 },
        { query: { enabled: Boolean(projectId) } },
    );
    const report = reports?.results?.[0];
    const { data: versions, isFetching: isFetchingVersions } =
        useApiReportsVersionsList(String(report?.id ?? ''), undefined, {
            query: { enabled: Boolean(report) },
        });

    if (!projectId) {
        return (
            <Alert severity="info">
                {formatMessage(MESSAGES.mobileReportSaveProjectFirst)}
            </Alert>
        );
    }

    return (
        <Box position="relative" data-testid="project-mobile-report">
            {(isFetchingReport || isFetchingVersions) && (
                <LoadingSpinner absolute />
            )}
            <Typography variant="body2" mb={2}>
                {formatMessage(MESSAGES.mobileReportHelp)}
            </Typography>
            {!hasReportsFeatureFlag && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.mobileReportFeatureFlagWarning)}
                </Alert>
            )}
            {report && <CurrentMobileReport report={report} />}
            {!report && !isFetchingReport && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.mobileReportNone)}
                </Alert>
            )}
            <MobileReportUploadForm projectId={projectId} report={report} />
            {report && versions && versions.length > 0 && (
                <MobileReportVersionsTable
                    report={report}
                    versions={versions}
                />
            )}
        </Box>
    );
};
