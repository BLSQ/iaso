import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import { Divider } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import MESSAGES from '../../../../constants/messages';
import { useReasonsDelayOptions } from './hooks/reasons';
import { ReasonsForDelayButton } from './ReasonsForDelayButton';
import { DateInput } from '../../../../components/Inputs/DateInput';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';

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
    // @ts-ignore
    const activeLocale = useSelector(state => state.app.locale);
    const { code: locale } = activeLocale;
    const { data: reasonsForDelayOptions } = useReasonsDelayOptions(locale);
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
                name="reason_for_delay"
                component={SingleSelect}
                fullWidth
                required
                clearable={false}
                options={reasonsForDelayOptions ?? []}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    ReasonForDelayModal,
    ReasonsForDelayButton,
);

export { modalWithButton as ReasonForDelayModal };
