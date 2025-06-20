import React, { FunctionComponent } from 'react';
import { ConfirmCancelModal } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';

type Props = {
    open: boolean;
    onClose: () => void;
    onChangeAllRounds: () => void;
    onChangeCurrentRoundOnly: () => void;
    closeDialog: () => void;
};

export const ToggleRoundOnHoldModal: FunctionComponent<Props> = ({
    open,
    onClose,
    onChangeAllRounds,
    onChangeCurrentRoundOnly,
    closeDialog,
}) => {
    return (
        <ConfirmCancelModal
            open={open}
            onClose={onClose}
            id={'ToggleRoundOnHoldModal'}
            dataTestId={'ToggleRoundOnHoldModal'}
            titleMessage={MESSAGES.removeOnHoldLaterRounds}
            closeDialog={closeDialog}
            onConfirm={onChangeAllRounds}
            onCancel={onChangeCurrentRoundOnly}
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
            children={null}
        />
    );
};
