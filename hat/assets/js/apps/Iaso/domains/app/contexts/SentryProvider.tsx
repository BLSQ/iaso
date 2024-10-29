import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import * as Sentry from '@sentry/browser';
import React, {
    createContext,
    FunctionComponent,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useCurrentUser } from '../../../utils/usersUtils';

type SentryContextType = {
    hasConsent: boolean;
    setConsent: (consent: boolean) => void;
};

export type SentryConfig = {
    SENTRY_URL?: string;
    SENTRY_ENVIRONMENT?: string;
};

type Props = {
    children: React.ReactNode;
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
    // Return early if no consent or no DSN
    if (!consent || !window.SENTRY_CONFIG?.SENTRY_URL) return;
    Sentry.init({
        dsn: window.SENTRY_CONFIG.SENTRY_URL,
        environment: window.SENTRY_CONFIG.SENTRY_ENVIRONMENT || 'development',
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // Adjust deduplication settings
        sampleRate: 1.0,
        tracesSampleRate: 1.0,
        attachStacktrace: true,
        normalizeDepth: 10,
        // Optional: Disable deduplication
        ignoreErrors: [], // Empty array to capture all errors
        integrations: [
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
                maskAllInputs: false,
                networkDetailAllowUrls: [
                    window.location.origin,
                    `${window.location.origin}/api`,
                ],
            }),
        ],
    });
};

export const SentryProvider: FunctionComponent<Props> = ({ children }) => {
    const [showDialog, setShowDialog] = useState(false);
    const currentUser = useCurrentUser();
    const [hasConsent, setHasConsent] = useState(
        () => localStorage.getItem('sentry-consent') === 'true',
    );

    useEffect(() => {
        const hasStoredConsent = localStorage.getItem('sentry-consent');
        if (!hasStoredConsent && Boolean(window.SENTRY_CONFIG?.SENTRY_URL)) {
            setShowDialog(true);
        }
        if (hasStoredConsent) {
            initSentry(hasStoredConsent === 'true');
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            Sentry.setUser({
                id: currentUser.id,
                username: currentUser.user_name,
                email: currentUser.email,
            });
        }
    }, [currentUser]);

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
            <Dialog open={showDialog} onClose={() => handleConsent(false)}>
                <DialogTitle>Analytics Consent</DialogTitle>
                <DialogContent>
                    We use Sentry to collect session replay data to improve our
                    service quality and debug issues. This includes recording
                    your interactions with our application. Your privacy is
                    important to us, and you can change this setting at any
                    time.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleConsent(false)}>
                        Decline
                    </Button>
                    <Button
                        onClick={() => handleConsent(true)}
                        variant="contained"
                    >
                        Accept
                    </Button>
                </DialogActions>
            </Dialog>
        </SentryContext.Provider>
    );
};

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
