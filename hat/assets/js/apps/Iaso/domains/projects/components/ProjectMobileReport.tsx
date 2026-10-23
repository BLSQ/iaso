import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Link,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {
    FilesUpload,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { convertToDateTimeRfc } from '../../../components/Cells/DateTimeCell';
import InputComponent from '../../../components/forms/InputComponent';
import {
    useGetMobileReportVersions,
    useGetProjectMobileReport,
    usePublishMobileReportVersion,
    useUploadMobileReport,
} from '../hooks/requests/mobileReports';
import MESSAGES from '../messages';

type Props = {
    projectId?: number | string | null;
    hasReportsFeatureFlag: boolean;
};

const zipAccept = {
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
};

export const ProjectMobileReport: FunctionComponent<Props> = ({
    projectId,
    hasReportsFeatureFlag,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: report, isFetching: isFetchingReport } =
        useGetProjectMobileReport(projectId);
    const { data: versions, isFetching: isFetchingVersions } =
        useGetMobileReportVersions(report?.id);
    const { mutateAsync: upload, isLoading: isUploading } =
        useUploadMobileReport();
    const { mutate: publish, isLoading: isPublishing } =
        usePublishMobileReportVersion();

    const [files, setFiles] = useState<File[]>([]);
    const [reportName, setReportName] = useState<string>('');
    const [versionName, setVersionName] = useState<string>('');
    const [publishNow, setPublishNow] = useState<boolean>(true);

    const handleUpload = useCallback(() => {
        if (!projectId || files.length === 0) return;
        upload({
            projectId,
            reportId: report?.id,
            file: files[0],
            name: reportName,
            versionName,
            publish: publishNow,
        })
            .then(() => {
                setFiles([]);
                setVersionName('');
            })
            // The error is shown in the snackbar; keep the file so it can be fixed and retried.
            .catch(() => null);
    }, [
        projectId,
        files,
        upload,
        report?.id,
        reportName,
        versionName,
        publishNow,
    ]);

    if (!projectId) {
        return (
            <Alert severity="info">
                {formatMessage(MESSAGES.mobileReportSaveProjectFirst)}
            </Alert>
        );
    }

    return (
        <Box position="relative" data-testid="project-mobile-report">
            {(isFetchingReport ||
                isFetchingVersions ||
                isUploading ||
                isPublishing) && <LoadingSpinner absolute />}
            <Typography variant="body2" mb={2}>
                {formatMessage(MESSAGES.mobileReportHelp)}
            </Typography>
            {!hasReportsFeatureFlag && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.mobileReportFeatureFlagWarning)}
                </Alert>
            )}
            {report ? (
                <Box mb={2}>
                    <Typography variant="subtitle2">
                        {formatMessage(MESSAGES.mobileReportCurrent)}
                    </Typography>
                    <Typography variant="body2">
                        {report.name} —{' '}
                        {formatMessage(MESSAGES.mobileReportPublishedVersion)}
                        {': '}
                        {report.published_version}
                        {report.url && (
                            <>
                                {' '}
                                (
                                <Link href={report.url} download>
                                    {formatMessage(MESSAGES.download)}
                                </Link>
                                )
                            </>
                        )}
                    </Typography>
                </Box>
            ) : (
                !isFetchingReport && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {formatMessage(MESSAGES.mobileReportNone)}
                    </Alert>
                )
            )}

            <Typography variant="subtitle2">
                {formatMessage(
                    report
                        ? MESSAGES.mobileReportUploadVersion
                        : MESSAGES.mobileReportUploadFirst,
                )}
            </Typography>
            <FilesUpload
                files={files}
                onFilesSelect={setFiles}
                multi={false}
                accept={zipAccept}
                placeholder={formatMessage(MESSAGES.mobileReportZip)}
            />
            {!report && (
                <InputComponent
                    keyValue="report_name"
                    type="text"
                    value={reportName}
                    onChange={(_key, value) => setReportName(value)}
                    label={MESSAGES.mobileReportName}
                />
            )}
            <InputComponent
                keyValue="version_name"
                type="text"
                value={versionName}
                onChange={(_key, value) => setVersionName(value)}
                label={MESSAGES.mobileReportVersionName}
            />
            {report && (
                <InputComponent
                    keyValue="publish"
                    type="checkbox"
                    value={publishNow}
                    onChange={(_key, value) => setPublishNow(value)}
                    label={MESSAGES.mobileReportPublishNow}
                />
            )}
            <Box mt={1} mb={3}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                    data-testid="mobile-report-upload"
                >
                    {formatMessage(MESSAGES.mobileReportUpload)}
                </Button>
            </Box>

            {report && versions && versions.length > 0 && (
                <>
                    <Typography variant="subtitle2">
                        {formatMessage(MESSAGES.mobileReportVersions)}
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(
                                        MESSAGES.mobileReportVersionName,
                                    )}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(
                                        MESSAGES.mobileReportUploadedAt,
                                    )}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.status)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {versions.map(version => (
                                <TableRow
                                    key={version.id}
                                    data-testid={`mobile-report-version-${version.id}`}
                                >
                                    <TableCell>
                                        {version.url ? (
                                            <Link href={version.url} download>
                                                {version.name}
                                            </Link>
                                        ) : (
                                            version.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {convertToDateTimeRfc(
                                            version.created_at,
                                        )}
                                        {version.created_by &&
                                            ` — ${version.created_by}`}
                                    </TableCell>
                                    <TableCell>
                                        {version.id ===
                                        report.published_version_id ? (
                                            <Chip
                                                size="small"
                                                color="success"
                                                label={formatMessage(
                                                    MESSAGES.mobileReportPublished,
                                                )}
                                            />
                                        ) : (
                                            <Chip
                                                size="small"
                                                label={formatMessage(
                                                    MESSAGES.mobileReportUnpublished,
                                                )}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {version.id !==
                                            report.published_version_id && (
                                            <Button
                                                size="small"
                                                onClick={() =>
                                                    publish({
                                                        reportId: report.id,
                                                        versionId: version.id,
                                                    })
                                                }
                                                disabled={isPublishing}
                                            >
                                                {formatMessage(
                                                    MESSAGES.mobileReportPublish,
                                                )}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}
        </Box>
    );
};
