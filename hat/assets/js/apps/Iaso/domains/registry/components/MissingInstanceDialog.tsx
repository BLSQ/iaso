import React, { FunctionComponent } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { MissingInstanceButton } from './MissingInstanceButton';

type Props = {
    missingOrgUnits: OrgUnit[];
    isOpen: boolean;
    closeDialog: () => void;
};

const MissingInstanceDialog: FunctionComponent<Props> = ({
    missingOrgUnits,
    closeDialog,
    isOpen,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleConfirm = () => {
        console.log('confirm', missingOrgUnits);
    };

    return (
        <ConfirmCancelModal
            titleMessage={formatMessage(MESSAGES.missingSubmission)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="missing-submbissions"
            id="missing-submbissions"
            onClose={() => null}
        >
            ICI
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(
    MissingInstanceDialog,
    MissingInstanceButton,
);

export { modalWithButton as MissingInstanceDialog };
