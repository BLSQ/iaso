import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Box, Typography } from '@mui/material';
import { MENU_HEIGHT_WITHOUT_TABS, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { ACTIONS_HEIGHT } from './Actions';

type Props = {
    xformXml: string | null;
};
const styles: SxStyles = {
    root: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - ${ACTIONS_HEIGHT}px)`,
        overflow: 'hidden',
        flex: 1,
        position: 'relative',
    },
};
export const FormPreview: FunctionComponent<Props> = ({ xformXml }) => {
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
                        submitDisabledMessage: formatMessage(
                            MESSAGES.previewSubmitUnavailable,
                        ),
                    },
                    '*',
                );
            }, 500);
        }
    }, [formatMessage]);

    const showIframe = Boolean(xformXml);

    return (
        <Box sx={styles.root}>
            {showIframe ? (
                <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    src={`${window.STATIC_URL ?? '/static/'}odk-preview/index.html`}
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
                        backgroundColor: '#f1f5f9',
                    }}
                >
                    <Typography variant="body1">
                        {formatMessage(MESSAGES.previewPlaceholder)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
