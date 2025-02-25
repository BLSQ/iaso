import { Grid } from '@mui/material';
import { FilesUpload, useSafeIntl } from 'bluesquare-components';
import React from 'react';
import { PdfPreview } from './PdfPreview';
import MESSAGES from './messages';
import { acceptPDF } from './utils';

type DocumentUploadWithPreviewProps = {
    errors: string[] | undefined;
    onFilesSelect: (files: File[]) => void;
    document?: File[] | string;
    disabled?: boolean;
};

const DocumentUploadWithPreview: React.FC<DocumentUploadWithPreviewProps> = ({
    errors,
    onFilesSelect,
    document,
    disabled = false,
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
                    <PdfPreview pdfUrl={pdfUrl} />
                </Grid>
            )}
        </Grid>
    );
};

export default DocumentUploadWithPreview;
