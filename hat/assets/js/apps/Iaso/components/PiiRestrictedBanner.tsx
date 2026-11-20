import React, { FunctionComponent } from 'react';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';
import type { SxProps, Theme } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { useCurrentUser } from '../utils/usersUtils';

const MESSAGES = defineMessages({
    title: {
        id: 'iaso.piiRestricted.title',
        defaultMessage: 'Some information is hidden',
    },
    description: {
        id: 'iaso.piiRestricted.description',
        defaultMessage:
            // eslint-disable-next-line max-len
            'You are not allowed to view personal data (PII). The questions containing personal data are not shown on this page and are left out of the exports. Ask an administrator for the "View personal data (PII) in submissions" permission if you need them.',
    },
});

type Props = {
    /**
     * Whether personal data is hidden on this page. By default, whether some
     * personal data of the account is hidden from the current user.
     */
    show?: boolean;
    sx?: SxProps<Theme>;
};

/**
 * Banner shown to users without the permission to view personal data (PII), on
 * the pages showing submission or entity data, so that the missing information
 * (removed questions, empty values) is not mistaken for unanswered questions.
 */
export const PiiRestrictedBanner: FunctionComponent<Props> = ({ show, sx }) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    if (!(show ?? currentUser?.pii_restricted)) {
        return null;
    }
    return (
        <Alert
            severity="info"
            icon={<VisibilityOff />}
            sx={sx}
            data-testid="pii-restricted-banner"
        >
            <AlertTitle>{formatMessage(MESSAGES.title)}</AlertTitle>
            {formatMessage(MESSAGES.description)}
        </Alert>
    );
};
