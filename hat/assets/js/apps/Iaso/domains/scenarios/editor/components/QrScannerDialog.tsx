import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import jsQR from 'jsqr';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const styles: SxStyles = {
    video: {
        width: '100%',
        maxHeight: '60vh',
        backgroundColor: 'black',
        borderRadius: 1,
        display: 'block',
    },
    hint: { mt: 1, color: 'text.secondary' },
    effects: { display: 'block', mt: 0.5, color: 'text.secondary' },
};

// how often the camera's image is read: often enough to feel instant, without loading the page
const SCAN_INTERVAL_MS = 200;

/** The text of the QR code in an image, if there's one (both light-on-dark and dark-on-light codes). */
export const readQrCode = (image: ImageData): string | null =>
    jsQR(image.data, image.width, image.height, {
        inversionAttempts: 'attemptBoth',
    })?.data ?? null;

const imageDataOf = (
    source: CanvasImageSource,
    width: number,
    height: number,
): ImageData | null => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || width === 0 || height === 0) {
        return null;
    }
    context.drawImage(source, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
};

type Props = {
    open: boolean;
    onClose: () => void;
    // the QR code's text: the dialog closes
    onDetect: (text: string) => void;
};

/**
 * Reads a QR code with the camera, as the phone's scan button does - or from an image (a photo of the card), when
 * there's no camera. Nothing leaves the browser: the image is decoded here.
 */
export const QrScannerDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    onDetect,
}) => {
    const { formatMessage } = useSafeIntl();
    const video = useRef<HTMLVideoElement>(null);
    const [cameraError, setCameraError] = useState<string>();
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        setCameraError(undefined);
        setImageError(false);
        let stream: MediaStream | undefined;
        let timer: number | undefined;
        let stopped = false;
        const stop = () => {
            stopped = true;
            window.clearInterval(timer);
            stream?.getTracks().forEach(track => track.stop());
        };
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError(formatMessage(MESSAGES.cameraNotSupported));
            return stop;
        }
        navigator.mediaDevices
            // the back camera when there's one (a phone, a tablet)
            .getUserMedia({ video: { facingMode: 'environment' } })
            .then(media => {
                stream = media;
                if (stopped || !video.current) {
                    stop();
                    return;
                }
                video.current.srcObject = media;
                video.current.play().catch(() => undefined);
                timer = window.setInterval(() => {
                    const element = video.current;
                    if (!element || element.readyState < 2) {
                        return;
                    }
                    const image = imageDataOf(
                        element,
                        element.videoWidth,
                        element.videoHeight,
                    );
                    const text = image && readQrCode(image);
                    if (text) {
                        stop();
                        onDetect(text);
                    }
                }, SCAN_INTERVAL_MS);
            })
            .catch(error => setCameraError(String(error?.message ?? error)));
        return stop;
    }, [open, onDetect, formatMessage]);

    const handleImage = (file?: File) => {
        if (!file) {
            return;
        }
        setImageError(false);
        createImageBitmap(file)
            .then(bitmap => {
                const image = imageDataOf(bitmap, bitmap.width, bitmap.height);
                const text = image && readQrCode(image);
                if (text) {
                    onDetect(text);
                } else {
                    setImageError(true);
                }
            })
            .catch(() => setImageError(true));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{formatMessage(MESSAGES.scanQrCodeTitle)}</DialogTitle>
            <DialogContent>
                {cameraError ? (
                    <Alert severity="info">
                        {formatMessage(MESSAGES.cameraUnavailable, {
                            message: cameraError,
                        })}
                    </Alert>
                ) : (
                    <>
                        <Box
                            component="video"
                            ref={video}
                            sx={styles.video}
                            muted
                            playsInline
                            aria-label={formatMessage(MESSAGES.scanQrCodeTitle)}
                        />
                        <Typography variant="body2" sx={styles.hint}>
                            {formatMessage(MESSAGES.pointCameraAtQrCode)}
                        </Typography>
                        {/* the system's effects (blur, background replaced) apply before the browser: they're
                            turned off there */}
                        <Typography variant="caption" sx={styles.effects}>
                            {formatMessage(MESSAGES.cameraEffectsHint)}
                        </Typography>
                    </>
                )}
                {imageError && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        {formatMessage(MESSAGES.noQrCodeInImage)}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button component="label">
                    {formatMessage(MESSAGES.chooseQrCodeImage)}
                    <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={event => handleImage(event.target.files?.[0])}
                    />
                </Button>
                <Button onClick={onClose}>
                    {formatMessage(MESSAGES.cancel)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
