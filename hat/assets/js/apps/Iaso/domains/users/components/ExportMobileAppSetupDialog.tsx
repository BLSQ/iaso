/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
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
    warning: {
        fontWeight: 'bold !important',
    },
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
    // const classes: Record<string, string> = useStyles();

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
                {formatMessage(MESSAGES.exportMobileAppModalBody, {
                    username: selectedUser.user_name,
                })}
            </Typography>
            <Typography mb={2} sx={styles.warning}>
                {formatMessage(MESSAGES.exportMobileAppModalBodyWarning)}
            </Typography>
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
