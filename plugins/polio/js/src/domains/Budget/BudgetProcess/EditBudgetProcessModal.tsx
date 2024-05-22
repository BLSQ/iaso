import { Box, Divider, Grid } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import React, { FunctionComponent, useCallback } from 'react';

import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { EditIconButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';

import { MultiSelect } from '../../../components/Inputs/MultiSelect';
import { useEditBudgetProcess } from '../hooks/api/useEditBudgetProcess';
import { useGetBudget } from '../hooks/api/useGetBudget';
import { useAvailableRoundsForUpdate } from '../hooks/api/useGetBudgetProcessAvailableRounds';
import MESSAGES from '../messages';
import { Budget, BudgetDetail } from '../types';
import { formatRoundNumber } from '../utils';
import { BudgetProcessModalTabs } from './BudgetProcessModalTabs';
import { useEditBudgetProcessSchema } from './validation';

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
        useAvailableRoundsForUpdate(
            budgetProcess.campaign_id,
            budgetProcess.id,
        );

    const { mutate: confirm } = useEditBudgetProcess();
    const schema = useEditBudgetProcessSchema();
    const formik = useFormik<Partial<BudgetDetail>>({
        initialValues: {},
        validateOnBlur: true,
        validateOnChange: true,
        validationSchema: schema,
        onSubmit: newValues => {
            confirm(newValues);
        },
    });
    const resetFormWithNewValues = useCallback(
        newValues => {
            const rounds =
                newValues.rounds?.map(round => ({
                    ...round,
                    value: round.id,
                    label: formatRoundNumber(round.number),
                })) || [];
            formik.resetForm({ values: { ...newValues, rounds } });
        },
        [formik],
    );

    const { data: budget } = useGetBudget(
        budgetProcess.id,
        resetFormWithNewValues,
    );

    const { isSubmitting, isValid, dirty } = formik;
    const allowConfirm = !isSubmitting && isValid && dirty;
    const disableEdition = budget?.has_data_in_budget_tool ?? false;
    const currentState = budget?.current_state?.label;
    return (
        <FormikProvider value={formik}>
            {isFetchingAvailableRounds && <LoadingSpinner />}
            {!isFetchingAvailableRounds && (
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
                    maxWidth="md"
                >
                    <Box mb={2}>
                        <Divider />
                    </Box>

                    <Grid container direction="row" item spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Field
                                label={formatMessage(MESSAGES.labelRound)}
                                name="rounds"
                                component={MultiSelect}
                                options={availableRounds}
                                returnFullObject
                            />
                        </Grid>
                        <BudgetProcessModalTabs
                            disableEdition={disableEdition}
                            currentState={currentState}
                        />
                    </Grid>
                </ConfirmCancelModal>
            )}
        </FormikProvider>
    );
};
const modalWithIcon = makeFullModal(EditBudgetProcessModal, EditIconButton);

export { modalWithIcon as EditBudgetProcessModal };
