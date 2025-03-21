import React from 'react';
import { Grid } from '@mui/material';
import { FilesUpload, useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { PdfPreview } from './PdfPreview';
import { acceptPDF } from './utils';

type DocumentUploadWithPreviewProps = {
    errors: string[] | undefined;
    onFilesSelect: (files: File[]) => void;
    document?: File[] | string;
    disabled?: boolean;
    scanResult?: string | undefined;
    scanTimestamp?: number | undefined;
    coloredScanResultIcon?: boolean;
};

const DocumentUploadWithPreview: React.FC<DocumentUploadWithPreviewProps> = ({
    errors,
    onFilesSelect,
    document,
    disabled = false,
    scanResult,
    scanTimestamp,
    coloredScanResultIcon,
}) => {
    const { formatMessage } = useSafeIntl();

    let pdfUrl: string | null = null;
    if (typeof document === 'string') {
        pdfUrl = document;
    } else if (
        Array.isArray(document) &&
        document.length > 0 &&
        document[0] instanceof File
    ) {
        pdfUrl = URL.createObjectURL(document[0]);
    } else if (document instanceof File) {
        pdfUrl = URL.createObjectURL(document);
    }

    return (
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={document ? 10 : 12}>
                <FilesUpload
                    accept={acceptPDF}
                    files={document ? [document as unknown as File] : []}
                    onFilesSelect={onFilesSelect}
                    multi={false}
                    errors={errors}
                    disabled={disabled}
                    placeholder={formatMessage(MESSAGES.document)}
                />
            </Grid>
            {pdfUrl && (
                <Grid item xs={2} sx={{ textAlign: 'right' }}>
                    <PdfPreview
                        pdfUrl={pdfUrl}
                        scanResult={scanResult}
                        scanTimestamp={scanTimestamp}
                        coloredScanResultIcon={coloredScanResultIcon}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export default DocumentUploadWithPreview;
