import { IconButton, makeFullModal, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { Divider } from '@material-ui/core';
import { AlertModal } from '../../../../../../../hat/assets/js/apps/Iaso/components/AlertModal';
import MESSAGES from '../../../constants/messages';
import { RoundDatesHistory } from './RoundDatesHistory';

type IconButtonProps = {
    onClick: () => void;
    dataTestId?: string;
};

export const RoundHistoryIconButton: FunctionComponent<IconButtonProps> = ({
    onClick,
    dataTestId = 'roundHistoryButton',
}) => {
    return (
        <IconButton
            dataTestId={dataTestId}
            onClick={onClick}
            overrideIcon={InfoOutlinedIcon}
            tooltipMessage={MESSAGES.seeHistory}
        />
    );
};

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
            <RoundDatesHistory roundId={roundId} />
        </AlertModal>
    );
};

const modalWithIconButton = makeFullModal(
    RoundDatesHistoryModal,
    RoundHistoryIconButton,
);

export { modalWithIconButton as RoundDatesHistoryModal };
