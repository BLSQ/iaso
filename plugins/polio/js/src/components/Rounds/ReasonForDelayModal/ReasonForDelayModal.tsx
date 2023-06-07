import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import { Divider } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import MESSAGES from '../../../constants/messages';
import { useReasonsForDateChangeOptions } from './reasons';
import { ReasonsForDelayButton } from './ReasonsForDelayButton';
import { DateInput } from '../../Inputs/DateInput';
import { SingleSelect } from '../../Inputs/SingleSelect';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    allowConfirm: boolean;
};
// Workaround to avoid TS error with onCancel prop
const noOp = () => null;
const ReasonForDelayModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    allowConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    const { handleSubmit, resetForm } = useFormikContext();
    const options = useReasonsForDateChangeOptions();
    return (
        <ConfirmCancelModal
            id="reasonForDelay-Modal"
            dataTestId="reasonForDelay-Modal"
            open={isOpen}
            closeDialog={closeDialog}
            titleMessage={formatMessage(MESSAGES.editRoundDates)}
            onConfirm={handleSubmit}
            onCancel={noOp}
            onClose={resetForm}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            allowConfirm={allowConfirm}
        >
            <Divider />
            <Field
                label={formatMessage(MESSAGES.startDate)}
                name="startDate"
                component={DateInput}
                fullWidth
                clearable={false}
            />
            <Field
                label={formatMessage(MESSAGES.endDate)}
                name="endDate"
                component={DateInput}
                fullWidth
                clearable={false}
            />
            <Field
                label={formatMessage(MESSAGES.reasonForDateChange)}
                name="reason"
                component={SingleSelect}
                fullWidth
                required
                clearable={false}
                options={options}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    ReasonForDelayModal,
    ReasonsForDelayButton,
);

export { modalWithButton as ReasonForDelayModal };
