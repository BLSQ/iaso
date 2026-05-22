import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

type Props = {
    messageKey: string;
    onClick: () => void;
};
const SnackBarButton: FunctionComponent<Props> = ({ messageKey, onClick }) => {
    const intl = useSafeIntl();
    return (
        <Button size="small" onClick={onClick}>
            {intl.formatMessage(MESSAGES[messageKey])}
        </Button>
    );
};

export default SnackBarButton;
