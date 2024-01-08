import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';

import VisibilityIcon from '@mui/icons-material/Visibility';

import MESSAGES from '../messages';

type IconButtonProps = {
    onClick: () => void;
    dataTestId?: string;
};

export const NotificationImportDetailButton: FunctionComponent<IconButtonProps> =
    ({
        onClick,
        dataTestId = 'open-polio-notifications-import-details-button',
    }) => {
        return (
            <IconButton
                dataTestId={dataTestId}
                onClick={onClick}
                overrideIcon={VisibilityIcon}
                tooltipMessage={MESSAGES.polioNotificationImportDetails}
            />
        );
    };
