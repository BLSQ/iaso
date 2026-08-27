import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Box, Divider, Paper, Typography } from '@mui/material';
import { MENU_HEIGHT_WITHOUT_TABS, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { ACTIONS_HEIGHT, ACTIONS_HEIGHT_MOBILE } from './Actions';

type Props = {
    xformXml: string | null;
};

const FORM_AI_NAVY = '#1e293b';

const WELCOME_STEPS = [
    MESSAGES.previewWelcomeStep1,
    MESSAGES.previewWelcomeStep2,
    MESSAGES.previewWelcomeStep3,
] as const;

const styles: SxStyles = {
    root: {
        height: {
            xs: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - ${ACTIONS_HEIGHT_MOBILE}px)`,
            lg: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - ${ACTIONS_HEIGHT}px)`,
        },
        overflow: 'hidden',
        flex: 1,
        position: 'relative',
    },
    emptyState: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 3,
        backgroundColor: '#f1f5f9',
    },
    welcomeCard: {
        position: 'relative',
        overflow: 'hidden',
        maxWidth: 560,
        width: '100%',
        p: 4,
        borderRadius: 3,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
    },
    welcomeTitle: {
        fontWeight: 700,
        fontSize: '1.35rem',
        color: FORM_AI_NAVY,
        mb: 1.5,
    },
    welcomeDescription: {
        color: 'text.secondary',
        lineHeight: 1.6,
        mb: 3,
    },
    steps: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        mb: 3,
    },
    stepRow: {
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: 700,
        flexShrink: 0,
    },
    stepText: {
        color: 'text.secondary',
        lineHeight: 1.6,
        pt: 0.25,
    },
    welcomeFooter: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'primary.main',
        fontSize: '0.875rem',
        lineHeight: 1.5,
    },
    welcomeFooterIcon: {
        fontSize: 18,
        flexShrink: 0,
    },
};

const WelcomeCard: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    const steps = useMemo(
        () => WELCOME_STEPS.map(message => formatMessage(message)),
        [formatMessage],
    );

    return (
        <Paper elevation={0} sx={styles.welcomeCard}>
            <Typography sx={styles.welcomeTitle}>
                {formatMessage(MESSAGES.previewWelcomeTitle)}
            </Typography>
            <Typography variant="body2" sx={styles.welcomeDescription}>
                {formatMessage(MESSAGES.previewWelcomeDescription)}
            </Typography>
            <Box sx={styles.steps}>
                {steps.map((step, index) => (
                    <Box key={step} sx={styles.stepRow}>
                        <Box sx={styles.stepNumber}>{index + 1}</Box>
                        <Typography variant="body2" sx={styles.stepText}>
                            {step}
                        </Typography>
                    </Box>
                ))}
            </Box>
            <Divider sx={{ mb: 2.5 }} />
            <Box sx={styles.welcomeFooter}>
                <AutoAwesomeIcon sx={styles.welcomeFooterIcon} />
                <Typography variant="body2" sx={{ color: 'inherit' }}>
                    {formatMessage(MESSAGES.previewWelcomeFooter)}
                </Typography>
            </Box>
        </Paper>
    );
};

export const FormPreview: FunctionComponent<Props> = ({ xformXml }) => {
    const { formatMessage } = useSafeIntl();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const latestXml = useRef<string | null>(null);

    useEffect(() => {
        if (xformXml && xformXml !== latestXml.current) {
            latestXml.current = xformXml;
            setIframeKey(prev => prev + 1);
        }
    }, [xformXml]);

    const handleIframeLoad = useCallback(() => {
        if (latestXml.current && iframeRef.current?.contentWindow) {
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
                <Box sx={styles.emptyState}>
                    <WelcomeCard />
                </Box>
            )}
        </Box>
    );
};
