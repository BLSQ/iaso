import React, { FunctionComponent } from 'react';
import Button from '@mui/material/Button';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type ButtonProps = {
    handleClose: () => void;
};

const DialogInfoButton: FunctionComponent<ButtonProps> = ({ handleClose }) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Button
            onClick={() => {
                handleClose();
            }}
            color="primary"
            autoFocus
        >
            {formatMessage(MESSAGES.userRoleInfoButton)}
        </Button>
    );
};

export default DialogInfoButton;
