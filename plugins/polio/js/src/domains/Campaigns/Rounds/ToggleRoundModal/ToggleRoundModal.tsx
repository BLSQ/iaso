import React, { FunctionComponent } from 'react';
import { ConfirmCancelModal, IntlMessage } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';

type Props = {
    open: boolean;
    onClose: () => void;
    onChangeAllRounds: () => void;
    onChangeCurrentRoundOnly: () => void;
    closeDialog: () => void;
    titleMessage?: IntlMessage;
    id?: string;
    dataTestId?: string;
};

export const ToggleRoundModal: FunctionComponent<Props> = ({
    open,
    onClose,
    onChangeAllRounds,
    onChangeCurrentRoundOnly,
    closeDialog,
    titleMessage = MESSAGES.removeOnHoldLaterRounds,
    id = 'ToggleRoundOnHoldModal',
    dataTestId = 'ToggleRoundOnHoldModal',
}) => {
    return (
        <ConfirmCancelModal
            open={open}
            onClose={onClose}
            id={id}
            dataTestId={dataTestId}
            titleMessage={titleMessage}
            closeDialog={closeDialog}
            onConfirm={onChangeAllRounds}
            onCancel={onChangeCurrentRoundOnly}
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
            children={null}
        />
    );
};
