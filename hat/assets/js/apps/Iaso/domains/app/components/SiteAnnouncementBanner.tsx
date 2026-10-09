import React, { FunctionComponent, useState } from 'react';
import Alert from '@mui/material/Alert';
import { useSiteAnnouncementMessage } from '../hooks/useSiteAnnouncementMessage';

// A given message is only dismissed once: if the message text changes (e.g. a new
// maintenance notice replaces an old one), the banner reappears.
const DISMISSED_MESSAGE_STORAGE_KEY =
    'iaso-dismissed-site-announcement-message';

const SiteAnnouncementBanner: FunctionComponent = () => {
    const message = useSiteAnnouncementMessage();
    const [dismissedMessage, setDismissedMessage] = useState<string | null>(
        () => {
            try {
                return localStorage.getItem(DISMISSED_MESSAGE_STORAGE_KEY);
            } catch {
                return null;
            }
        },
    );

    if (!message || message === dismissedMessage) {
        return null;
    }

    const handleClose = () => {
        try {
            localStorage.setItem(DISMISSED_MESSAGE_STORAGE_KEY, message);
        } catch {
            // localStorage may be unavailable (private browsing, blocked storage): the
            // banner will simply reappear on the next page load, which is an acceptable
            // fallback rather than crashing.
        }
        setDismissedMessage(message);
    };

    return (
        <Alert
            severity="warning"
            onClose={handleClose}
            sx={{ borderRadius: 0 }}
        >
            {message}
        </Alert>
    );
};

export default SiteAnnouncementBanner;
