import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type Props = {
    xlsformUuid: string | null;
    xformXml: string | null;
};

const ODK_PREVIEW_BASE = `${window.STATIC_URL ?? '/static'}/odk-preview/index.html`;

export const FormPreview: FunctionComponent<Props> = ({
    xlsformUuid,
    xformXml,
}) => {
    const { formatMessage } = useSafeIntl();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // Increment key to force iframe remount when XML changes
    const [iframeKey, setIframeKey] = useState(0);
    const latestXml = useRef<string | null>(null);

    // Track XML changes and force iframe reload
    useEffect(() => {
        if (xformXml && xformXml !== latestXml.current) {
            latestXml.current = xformXml;
            setIframeKey(prev => prev + 1);
        }
    }, [xformXml]);

    const handleIframeLoad = useCallback(() => {
        if (latestXml.current && iframeRef.current?.contentWindow) {
            // Small delay to let the Vue app initialize
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                    {
                        type: 'load-form-xml',
                        xml: latestXml.current,
                    },
                    '*',
                );
            }, 500);
        }
    }, []);

    const showIframe = Boolean(xformXml);

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
            <Box sx={{ flex: 1, position: 'relative' }}>
                {showIframe ? (
                    <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src={ODK_PREVIEW_BASE}
                        title="ODK Form Preview"
                        onLoad={handleIframeLoad}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                    />
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
