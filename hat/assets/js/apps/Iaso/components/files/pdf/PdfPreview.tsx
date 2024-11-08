import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { useCallback, useState } from 'react';
import { defineMessages } from 'react-intl';
import { Document, Page, pdfjs } from 'react-pdf';
import PdfSvgComponent from '../../svg/PdfSvgComponent';

// Set the workerSrc for pdfjs to enable the use of Web Workers.
// Web Workers allow the PDF.js library to process PDF files in a separate thread,
// keeping the main thread responsive and ensuring smooth UI interactions.
// Note: The PDF file itself is not transferred to the worker; only the processing is offloaded.
// This is necessary for the react-pdf library to function correctly.
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type PdfPreviewProps = {
    pdfUrl?: string;
};

export const MESSAGES = defineMessages({
    close: {
        defaultMessage: 'Close',
        id: 'blsq.buttons.label.close',
    },
    download: {
        defaultMessage: 'Download',
        id: 'blsq.buttons.label.download',
    },
});

export const PdfPreview: React.FC<PdfPreviewProps> = ({ pdfUrl }) => {
    const [open, setOpen] = useState(false); // State to manage dialog open/close

    const { formatMessage } = useSafeIntl();
    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleDownload = useCallback(() => {
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            const urlParts = pdfUrl.split('/');
            const fileName = urlParts[urlParts.length - 1] || 'document.pdf';
            link.download = fileName;
            link.click();
        }
    }, [pdfUrl]);
    return (
        <>
            <IconButton
                onClick={handleOpen}
                aria-label="preview document"
                disabled={!pdfUrl}
            >
                <PdfSvgComponent />
            </IconButton>
            {open && (
                <Dialog
                    fullWidth
                    maxWidth="md"
                    open={open}
                    onClose={handleClose}
                >
                    <DialogContent
                        sx={{
                            px: 0,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Document file={pdfUrl}>
                            <Page
                                pageNumber={1}
                                width={880}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        </Document>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDownload} color="primary">
                            {formatMessage(MESSAGES.download)}
                        </Button>
                        <Button onClick={handleClose} color="primary">
                            {formatMessage(MESSAGES.close)}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};
