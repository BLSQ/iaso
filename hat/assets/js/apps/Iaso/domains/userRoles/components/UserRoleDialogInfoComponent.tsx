import React, { FunctionComponent } from 'react';
import { SimpleModal, useSafeIntl } from 'bluesquare-components';
import { Typography } from '@mui/material';
import MESSAGES from '../messages';
import DialogInfoButton from './DialogInfoButton';

type Props = {
    infoOpen: boolean;
    // eslint-disable-next-line no-unused-vars
    setInfoOpen: (open: boolean) => void;
    closeDialog: () => void;
};

const UserRoleDialogInfoComponent: FunctionComponent<Props> = ({
    infoOpen,
    setInfoOpen,
    closeDialog,
}) => {
    const handleClose = () => {
        window.location.reload();
        setInfoOpen(false);
        closeDialog();
    };
    const { formatMessage } = useSafeIntl();
    return (
        <SimpleModal
            open={infoOpen}
            onClose={() => null}
            id="userRoleDialogInfo"
            dataTestId="userRoleDialogInfo"
            titleMessage={formatMessage(MESSAGES.userRoleDialogInfoTitle)}
            closeDialog={handleClose}
            // eslint-disable-next-line react/no-unstable-nested-components
            buttons={() => <DialogInfoButton handleClose={handleClose} />}
            maxWidth="sm"
            backdropClick
        >
            <Typography>
                {formatMessage(MESSAGES.userRoleDialogInfoMessage)}
            </Typography>
        </SimpleModal>
    );
};

export default UserRoleDialogInfoComponent;
