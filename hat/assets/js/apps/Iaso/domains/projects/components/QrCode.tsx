import React, { useState, useCallback, FunctionComponent } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { errorSnackBar, succesfullSnackBar } from 'Iaso/constants/snackBars';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

type Props = {
    qrCode: string;
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

export const QrCode: FunctionComponent<Props> = ({ qrCode }) => {
    const [open, setOpen] = useState(false);
    const { formatMessage } = useSafeIntl();

    const handleOpen = useCallback(() => setOpen(true), []);
    const handleClose = useCallback(() => setOpen(false), []);

    const handleShare = useCallback(async () => {
        try {
            const response = await fetch(qrCode);
            const blob = await response.blob();

            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            openSnackBar(succesfullSnackBar('qrCodeCopied'));
        } catch (error) {
            console.error('Failed to copy image:', error);
            openSnackBar(errorSnackBar('failedToCopyImage'));
        }
    }, [qrCode]);

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
        </>
    );
};
