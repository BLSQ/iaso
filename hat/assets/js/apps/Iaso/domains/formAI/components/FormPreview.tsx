import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { loadOdkPreviewMount } from '../loadOdkPreviewRemote';
import MESSAGES from '../messages';

type Props = {
    xlsformUuid: string | null;
    xformXml: string | null;
};

export const FormPreview: FunctionComponent<Props> = ({
    xlsformUuid,
    xformXml,
}) => {
    const { formatMessage } = useSafeIntl();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !xformXml) {
            return undefined;
        }

        let unmount: (() => void) | undefined;
        let cancelled = false;

        const mount = () => {
            setIsLoading(true);
            setError(null);

            loadOdkPreviewMount()
                .then(({ mountOdkPreview }) => {
                    if (cancelled) {
                        return;
                    }
                    unmount?.();
                    unmount = mountOdkPreview(container, {
                        formXml: xformXml,
                        submitDisabledMessage: formatMessage(
                            MESSAGES.previewSubmitUnavailable,
                        ),
                    });
                })
                .catch((err: unknown) => {
                    if (!cancelled) {
                        setError(
                            err instanceof Error
                                ? err.message
                                : 'Failed to load ODK preview',
                        );
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setIsLoading(false);
                    }
                });
        };

        mount();

        const onHotUpdate = () => {
            if (!cancelled) {
                mount();
            }
        };

        if (__ODK_PREVIEW_DEV__) {
            window.addEventListener('odk-preview-updated', onHotUpdate);
        }

        return () => {
            cancelled = true;
            unmount?.();
            if (__ODK_PREVIEW_DEV__) {
                window.removeEventListener('odk-preview-updated', onHotUpdate);
            }
        };
    }, [xformXml, formatMessage]);

    return (
        <Paper
            elevation={1}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {xlsformUuid && (
                <Box
                    sx={{
                        p: 1,
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        href={`/api/form_ai/download/${xlsformUuid}/`}
                        download="form.xlsx"
                    >
                        {formatMessage(MESSAGES.downloadXlsForm)}
                    </Button>
                </Box>
            )}
            <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {xformXml ? (
                    <>
                        {isLoading && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1,
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <CircularProgress size={32} />
                            </Box>
                        )}
                        {error && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 2,
                                    zIndex: 1,
                                }}
                            >
                                <Typography color="error" align="center">
                                    {error}
                                </Typography>
                            </Box>
                        )}
                        <Box
                            ref={containerRef}
                            sx={{
                                width: '100%',
                                height: '100%',
                                overflow: 'auto',
                            }}
                        />
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary',
                        }}
                    >
                        <Typography variant="body1">
                            {formatMessage(MESSAGES.previewPlaceholder)}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};
