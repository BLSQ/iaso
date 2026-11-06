import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { FilesUpload, useSafeIntl } from 'bluesquare-components';
import {
    Report,
    useApiReportsCreate,
    useApiReportsVersionsCreate,
} from 'Iaso/api/reports';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../../messages';

type Props = {
    projectId: number | string;
    report?: Report;
};

const zipAccept = {
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
};

// Shows why the zip was refused (no index.html at the root, not a zip...).
const mutationMeta = { useApiErrorMessage: true };

// A project has at most one report: the first upload creates it, the next ones add versions.
export const MobileReportUploadForm: FunctionComponent<Props> = ({
    projectId,
    report,
}) => {
    const { formatMessage } = useSafeIntl();
    const [files, setFiles] = useState<File[]>([]);
    const [reportName, setReportName] = useState<string>('');
    const [versionName, setVersionName] = useState<string>('');
    const [publishNow, setPublishNow] = useState<boolean>(true);

    // On error the snackbar shows why, and the file is kept so it can be fixed and retried.
    const onSuccess = useCallback(() => {
        setFiles([]);
        setVersionName('');
    }, []);
    const { mutate: createReport, isLoading: isCreating } = useApiReportsCreate(
        { mutation: { onSuccess, meta: mutationMeta } },
    );
    const { mutate: createVersion, isLoading: isAddingVersion } =
        useApiReportsVersionsCreate({
            mutation: { onSuccess, meta: mutationMeta },
        });
    const isUploading = isCreating || isAddingVersion;

    const handleUpload = useCallback(() => {
        const file = files[0];
        if (!file) return;
        if (report) {
            createVersion({
                id: String(report.id),
                data: {
                    file,
                    name: versionName || file.name,
                    publish: publishNow,
                },
            });
        } else {
            createReport({
                data: {
                    project: Number(projectId),
                    name: reportName || file.name,
                    file,
                    version_name: versionName || file.name,
                },
            });
        }
    }, [
        files,
        report,
        createVersion,
        versionName,
        publishNow,
        createReport,
        projectId,
        reportName,
    ]);

    return (
        <>
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
        </>
    );
};
