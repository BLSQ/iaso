/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    IntlMessage,
    makeFullModal,
    ConfirmCancelModal,
    AddButton,
    IconButton,
} from 'bluesquare-components';

import { MESSAGES } from './messages';
import { ScaleThreshold } from './types';
import { LegendBuilder } from './Index';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    // eslint-disable-next-line no-unused-vars
    onConfirm: (threshold?: ScaleThreshold) => void;
    threshold?: ScaleThreshold;
};
const Dialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    onConfirm,
    threshold,
}) => {
    const [scaleThreshold, setScaleThreshold] = useState<
        ScaleThreshold | undefined
    >(threshold);
    const handleConfirm = useCallback(() => {
        onConfirm(scaleThreshold);
        closeDialog();
    }, [closeDialog, onConfirm, scaleThreshold]);
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={handleConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            maxWidth="xs"
            open={isOpen}
            closeDialog={() => null}
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="legend-dialog"
            dataTestId="uslegender-dialog"
        >
            <LegendBuilder
                defaultScaleThreshold={threshold}
                onChange={newThreshold => {
                    setScaleThreshold(newThreshold);
                }}
            />
        </ConfirmCancelModal>
    );
};

type PropsIcon = {
    onClick: () => void;
};

export const EditIconButton: FunctionComponent<PropsIcon> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};

const modalWithButton = makeFullModal(Dialog, AddButton);
const modalWithIcon = makeFullModal(Dialog, EditIconButton);

export {
    modalWithButton as AddLegendDialog,
    modalWithIcon as EditLegendDialog,
};
