/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import {
    ConfirmCancelModal,
    IconButton,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import { MutateFunction } from 'react-query';

import MESSAGES from '../messages';
import { Profile, useCurrentUser } from '../../../utils/usersUtils';

const styles: SxStyles = {
    username: {
        fontWeight: 'bold',
    },
    warning: {
        marginBottom: '1rem',
    }
};

type Props = {
    titleMessage: IntlMessage;
    selectedUser: Profile;
    onConfirm: MutateFunction<any>;
    isOpen: boolean;
    closeDialog: () => void;
    exporting: boolean;
};
// Declaring defaultData here because using initialData={} in the props below will cause and infinite loop
const ExportMobileAppSetupDialogComponent: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    selectedUser,
    onConfirm,
    closeDialog,
    exporting,
}) => {
    const connectedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();

    console.log('selectedUser', selectedUser);
    console.log('connectedUser', connectedUser);
    console.log('onConfirm', onConfirm);
    console.log('exporting', exporting);

    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.exportMobileAppModalBtn}
            maxWidth="md"
            open={isOpen}
            closeDialog={() => null}
            allowConfirm={!exporting}
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="export-dialog"
            dataTestId="export-dialog"
        >
            <Typography mb={2}>
                {formatMessage(MESSAGES.exportMobileAppModalBody)}
            </Typography>
            <Typography mb={2} sx={styles.username}>
                {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.user_name})
            </Typography>
            <Alert severity="warning" sx={styles.warning}>
                {formatMessage(MESSAGES.exportMobileAppModalBodyWarning)}
            </Alert>
            <Typography mb={2}>
                {formatMessage(MESSAGES.exportMobileAppModalBodySure)}
            </Typography>
        </ConfirmCancelModal>
    );
};

type PropsIcon = {
    onClick: () => void;
};

export const DownloadIconButton: FunctionComponent<PropsIcon> = ({
    onClick,
}) => {
    return (
        <IconButton
            onClick={onClick}
            icon="download"
            tooltipMessage={MESSAGES.exportMobileAppTooltip}
        />
    );
};

const modal = makeFullModal(
    ExportMobileAppSetupDialogComponent,
    DownloadIconButton,
);

export { modal as ExportMobileAppSetupDialog };
