import React, { useState, useCallback, memo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Snackbar,
    Alert,
    Box,
    Paper,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

type Props = {
    qrCode: string;
};

type SnackbarState = {
    open: boolean;
    message: string;
    isError: boolean;
};

const styles: SxStyles = {
    qrCode: {
        width: 40,
        height: 40,
        cursor: 'pointer',
    },
    qrCodeLarge: {
        width: 300,
        height: 300,
    },
    qrCodeContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 2,
        pb: 2,
    },
    snackbarPaper: {
        backgroundColor: 'rgb(50, 50, 50)',
        color: '#fff',
        padding: '6px 16px',
        borderRadius: '4px',
    },
};

const QrCode: React.FunctionComponent<Props> = ({ qrCode }) => {
    const [open, setOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        isError: false,
    });
    const { formatMessage } = useSafeIntl();

    const handleOpen = useCallback(() => setOpen(true), []);
    const handleClose = useCallback(() => setOpen(false), []);
    const handleSnackbarClose = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const handleShare = useCallback(async () => {
        try {
            const response = await fetch(qrCode);
            const blob = await response.blob();

            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);

            setSnackbar({
                open: true,
                message: formatMessage(MESSAGES.qrCodeCopied),
                isError: false,
            });
        } catch (error) {
            console.error('Failed to copy image:', error);
            setSnackbar({
                open: true,
                message: formatMessage(MESSAGES.failedToCopyImage),
                isError: true,
            });
        }
    }, [qrCode, formatMessage]);

    return (
        <>
            <Box
                component="img"
                src={qrCode}
                sx={styles.qrCode}
                alt="QR Code"
                onClick={handleOpen}
            />
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>{formatMessage(MESSAGES.qrCodeTitle)}</DialogTitle>
                <DialogContent>
                    <Box sx={styles.qrCodeContainer}>
                        <Box
                            component="img"
                            src={qrCode}
                            sx={styles.qrCodeLarge}
                            alt="QR Code Large"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>
                        {formatMessage(MESSAGES.close)}
                    </Button>
                    <Button
                        onClick={handleShare}
                        variant="contained"
                        color="primary"
                    >
                        {formatMessage(MESSAGES.copyToClipboard)}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar.isError ? (
                    <Alert
                        onClose={handleSnackbarClose}
                        severity="error"
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                ) : (
                    <Paper sx={styles.snackbarPaper}>{snackbar.message}</Paper>
                )}
            </Snackbar>
        </>
    );
};

export default memo(QrCode);
