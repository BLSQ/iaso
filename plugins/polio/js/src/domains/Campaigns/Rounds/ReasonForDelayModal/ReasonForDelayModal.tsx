import { Box, Divider } from '@mui/material';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';
import { useCurrentLocale } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { DateInput } from '../../../../components/Inputs/DateInput';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';
import MESSAGES from '../../../../constants/messages';
import { ReasonsForDelayButton } from './ReasonsForDelayButton';
import { useReasonsDelayOptions } from './hooks/reasons';

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
    const activeLocale = useCurrentLocale();
    const { data: reasonsForDelayOptions } =
        useReasonsDelayOptions(activeLocale);
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
            <Box mt={2}>
                <Field
                    label={formatMessage(MESSAGES.startDate)}
                    name="startDate"
                    component={DateInput}
                    fullWidth
                    clearable={false}
                />
            </Box>
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
