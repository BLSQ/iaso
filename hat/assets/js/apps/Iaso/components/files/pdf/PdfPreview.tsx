import React, {
    ComponentType,
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
} from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { Document, Page, pdfjs } from 'react-pdf';
import { fileScanResultInfected } from '../../../constants/fileScanResults';
import { SxStyles } from '../../../types/general';
import { FileScanHeader } from './FileScanHeader';
import { FileScanStatusOpenButton } from './FileScanStatusOpenButton';
import MESSAGES from './messages';

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
    OpenButtonComponent?: ComponentType<{
        onClick: () => void;
        disabled: boolean;
    }>;
    buttonProps?: Record<string, unknown>;
    scanResult?: string | undefined;
    scanTimestamp?: number | undefined;
    coloredScanResultIcon?: boolean;
};

const styles: SxStyles = {
    dialogContent: {
        px: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        height: '80vh',
        overflow: 'auto',
    },
    documentContainer: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
    },
    dialogActions: {
        flexDirection: 'column',
        paddingBottom: 2,
    },
    pageControls: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    dialogActionsButtons: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
        width: '100%',
    },
};

export const PdfPreview: FunctionComponent<PdfPreviewProps> = ({
    pdfUrl,
    OpenButtonComponent,
    buttonProps,
    scanResult,
    scanTimestamp,
    coloredScanResultIcon,
}) => {
    const [open, setOpen] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);

    const { formatMessage } = useSafeIntl();
    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const isFileSafeToDisplayAndDownload = useMemo(() => {
        return !scanResult || scanResult !== fileScanResultInfected;
    }, [scanResult]);

    const handleDownload = useCallback(() => {
        if (pdfUrl && isFileSafeToDisplayAndDownload) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            const urlParts = pdfUrl.split('/');
            const fileName = urlParts[urlParts.length - 1] || 'document.pdf';
            link.download = fileName;
            link.click();
        }
    }, [isFileSafeToDisplayAndDownload, pdfUrl]);

    const onDocumentLoadSuccess = ({
        numPages: nextNumPages,
    }: {
        numPages: number;
    }) => {
        setNumPages(nextNumPages);
        setPageNumber(1);
    };

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => {
            const newPageNumber = prevPageNumber + offset;
            return Math.min(Math.max(1, newPageNumber), numPages || 1);
        });
    };

    const OpenButton = OpenButtonComponent || FileScanStatusOpenButton;

    return (
        <>
            <OpenButton
                onClick={handleOpen}
                disabled={!pdfUrl}
                coloredIcon={coloredScanResultIcon}
                scanResult={scanResult}
                {...buttonProps}
            />
            {open && (
                <Dialog
                    fullWidth
                    maxWidth="md"
                    open={open}
                    onClose={handleClose}
                >
                    <DialogContent sx={styles.dialogContent}>
                        <FileScanHeader
                            scanResult={scanResult}
                            scanTimestamp={scanTimestamp}
                        />
                        {isFileSafeToDisplayAndDownload && (
                            <Box sx={styles.documentContainer}>
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={<LoadingSpinner fixed={false} />}
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        width={880}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                </Document>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={styles.dialogActions}>
                        {isFileSafeToDisplayAndDownload && (
                            <Box sx={styles.pageControls}>
                                <IconButton
                                    onClick={() => changePage(-1)}
                                    disabled={pageNumber <= 1}
                                    size="small"
                                >
                                    <NavigateBefore />
                                </IconButton>
                                <Box>
                                    {formatMessage(MESSAGES.pageInfo, {
                                        current: pageNumber,
                                        total: numPages || 0,
                                    })}
                                </Box>
                                <IconButton
                                    onClick={() => changePage(1)}
                                    disabled={pageNumber >= (numPages || 1)}
                                    size="small"
                                >
                                    <NavigateNext />
                                </IconButton>
                            </Box>
                        )}
                        <Box sx={styles.dialogActionsButtons}>
                            <Button
                                onClick={handleDownload}
                                color="primary"
                                disabled={!isFileSafeToDisplayAndDownload}
                            >
                                {formatMessage(MESSAGES.download)}
                            </Button>
                            <Button onClick={handleClose} color="primary">
                                {formatMessage(MESSAGES.close)}
                            </Button>
                        </Box>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};
