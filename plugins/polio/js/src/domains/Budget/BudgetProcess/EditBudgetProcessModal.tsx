import React, { FunctionComponent } from 'react';
import { Box, Divider } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { EditIconButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';

import MESSAGES from '../messages';
import { Budget } from '../types';
import { MultiSelect } from '../../../components/Inputs/MultiSelect';
import { useGetAvailableRounds } from '../hooks/api/useEditBudgetProcess';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    budgetProcess: Budget;
};

const EditBudgetProcessModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    budgetProcess,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: availableRounds, isFetching: isFetchingAvailableRounds } =
        useGetAvailableRounds(budgetProcess.campaign_id, budgetProcess.id);

    // const { mutate: confirm } = useEditBudgetProcess();
    // const schema = useNotificationSchema();
    const formik = useFormik({
        initialValues: {
            rounds: budgetProcess?.rounds?.map(round => round.id),
        },
        enableReinitialize: true,
        validateOnBlur: true,
        // validationSchema: schema,
        onSubmit: async values => {
            console.log('validate', values);
            // confirm(values);
        },
    });
    const isFormChanged = !isEqual(formik.values, formik.initialValues);
    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged;

    return (
        <>
            {isFetchingAvailableRounds && <LoadingSpinner />}
            {!isFetchingAvailableRounds && (
                <FormikProvider value={formik}>
                    <ConfirmCancelModal
                        open={isOpen}
                        closeDialog={closeDialog}
                        onClose={() => null}
                        id="edit-budget-process"
                        dataTestId="edit-budget-process"
                        titleMessage={MESSAGES.modalEditBudgetProcess}
                        onConfirm={() => formik.handleSubmit()}
                        onCancel={() => null}
                        confirmMessage={MESSAGES.modalWriteConfirm}
                        allowConfirm={allowConfirm}
                        cancelMessage={MESSAGES.modalWriteCancel}
                    >
                        <Box mb={2}>
                            <Divider />
                        </Box>
                        <Box mb={2}>
                            <Field
                                label={formatMessage(MESSAGES.labelRound)}
                                name="rounds"
                                component={MultiSelect}
                                options={availableRounds}
                            />
                        </Box>
                    </ConfirmCancelModal>
                </FormikProvider>
            )}
        </>
    );
};
const modalWithIcon = makeFullModal(EditBudgetProcessModal, EditIconButton);

export { modalWithIcon as EditBudgetProcessModal };
