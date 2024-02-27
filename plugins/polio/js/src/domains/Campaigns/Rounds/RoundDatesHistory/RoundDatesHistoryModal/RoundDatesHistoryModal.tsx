import React, { FunctionComponent } from 'react';
import { makeFullModal, useSafeIntl, AlertModal } from 'bluesquare-components';
import { Divider } from '@mui/material';
import MESSAGES from '../../../../../constants/messages';
import { RoundDatesHistoryTable } from '../RoundDatesHistoryTable';
import { RoundDatesHistoryIconButton } from './RoundDatesHistoryIconButton';

type Props = {
    roundId?: number;
    roundNumber?: number;
    isOpen: boolean;
    closeDialog: () => void;
};

const RoundDatesHistoryModal: FunctionComponent<Props> = ({
    roundId,
    roundNumber,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <AlertModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={formatMessage(MESSAGES.historyForRound, {
                roundNumber,
            })}
            maxWidth="md"
        >
            <Divider />
            <RoundDatesHistoryTable roundId={roundId} />
        </AlertModal>
    );
};

const modalWithIconButton = makeFullModal(
    RoundDatesHistoryModal,
    RoundDatesHistoryIconButton,
);

export { modalWithIconButton as RoundDatesHistoryModal };
