import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import * as Sentry from '@sentry/browser';
import { browserTracingIntegration } from '@sentry/browser';
import { useSafeIntl } from 'bluesquare-components';
import React, {
    createContext,
    FunctionComponent,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { defineMessages } from 'react-intl';
import { SxStyles } from '../../../types/general';

type SentryContextType = {
    hasConsent: boolean;
    setConsent: (consent: boolean) => void;
};

export type SentryConfig = {
    SENTRY_URL?: string;
    SENTRY_ENVIRONMENT?: string;
    SENTRY_FRONT_ENABLED?: boolean;
};

type Props = {
    children: React.ReactNode;
    isCurrentRouteAnonymous: boolean;
};

const SentryContext = createContext<SentryContextType | undefined>(undefined);

export const useSentry = () => {
    const context = useContext(SentryContext);
    if (!context) {
        throw new Error('useSentry must be used within SentryProvider');
    }
    return context;
};
const initSentry = (consent: boolean) => {
    window.SENTRY_INITIALIZED = true;
    if (!consent || !window.SENTRY_CONFIG?.SENTRY_URL) return;
    Sentry.init({
        dsn: window.SENTRY_CONFIG.SENTRY_URL,
        environment: window.SENTRY_CONFIG.SENTRY_ENVIRONMENT || 'development',
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
        sampleRate: 1.0,
        tracesSampleRate: 1.0,
        attachStacktrace: true,
        normalizeDepth: 10,
        ignoreErrors: [],
        integrations: [
            browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
                maskAllInputs: false,
                networkDetailAllowUrls: [
                    window.location.origin,
                    `${window.location.origin}/api`,
                ],
                maxReplayDuration: 600000,
                useCompression: true,
            }),
        ],
    });
};

const styles: SxStyles = {
    paper: { p: 2, maxWidth: 900, width: '100%' },
    title: { p: 0, mb: 1 },
    content: { px: 0, py: 1 },
    buttons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
    },
};

const MESSAGES = defineMessages({
    analyticsConsent: {
        defaultMessage: 'Analytics Consent',
        id: 'iaso.analytics.consent',
    },
    analyticsConsentDescription: {
        defaultMessage:
            'We use Sentry to collect session replay data to improve our service quality and debug issues. This includes recording your interactions with our application.',
        id: 'iaso.analytics.consent.description',
    },
    decline: {
        defaultMessage: 'Decline',
        id: 'iaso.analytics.consent.decline',
    },
    accept: {
        defaultMessage: 'Accept',
        id: 'iaso.analytics.consent.accept',
    },
});
export const SentryProvider: FunctionComponent<Props> = ({
    children,
    isCurrentRouteAnonymous,
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [hasConsent, setHasConsent] = useState(
        () => localStorage.getItem('sentry-consent') === 'true',
    );
    const { formatMessage } = useSafeIntl();

    useEffect(() => {
        if (
            window.SENTRY_CONFIG?.SENTRY_FRONT_ENABLED &&
            !isCurrentRouteAnonymous
        ) {
            const hasStoredConsent = localStorage.getItem('sentry-consent');
            if (
                !hasStoredConsent &&
                Boolean(window.SENTRY_CONFIG?.SENTRY_URL)
            ) {
                setShowDialog(true);
            }
            if (hasStoredConsent) {
                if (!window.SENTRY_INITIALIZED) {
                    initSentry(hasStoredConsent === 'true');
                }
            }
        }
    }, [isCurrentRouteAnonymous]);

    const handleConsent = useCallback((consent: boolean) => {
        localStorage.setItem('sentry-consent', consent.toString());
        setHasConsent(consent);
        initSentry(consent);
        setShowDialog(false);
    }, []);

    const contextValue = useMemo(
        () => ({ hasConsent, setConsent: handleConsent }),
        [handleConsent, hasConsent],
    );
    return (
        <SentryContext.Provider value={contextValue}>
            {children}
            <Snackbar
                open={showDialog}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ maxWidth: '100%' }}
            >
                <Paper sx={styles.paper}>
                    <Box mb={1}>
                        <DialogTitle sx={styles.title}>
                            {formatMessage(MESSAGES.analyticsConsent)}
                        </DialogTitle>
                        <DialogContent sx={styles.content}>
                            {formatMessage(
                                MESSAGES.analyticsConsentDescription,
                            )}
                        </DialogContent>
                    </Box>
                    <Box sx={styles.buttons}>
                        <Button onClick={() => handleConsent(false)}>
                            {formatMessage(MESSAGES.decline)}
                        </Button>
                        <Button
                            onClick={() => handleConsent(true)}
                            variant="contained"
                        >
                            {formatMessage(MESSAGES.accept)}
                        </Button>
                    </Box>
                </Paper>
            </Snackbar>
        </SentryContext.Provider>
    );
};

// EXAMPLE OF HOW TO USE THE CONTEXT

// const YourSettingsComponent = () => {
//     const { hasConsent, setConsent } = useSentry();

//     return (
//         <FormControlLabel
//             control={
//                 <Switch
//                     checked={hasConsent}
//                     onChange={(e) => setConsent(e.target.checked)}
//                 />
//             }
//             label="Allow session recording for improved support"
//         />
//     );
// };
