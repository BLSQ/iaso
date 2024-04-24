import { Box, Divider, Grid, Tab, Tabs } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import React, { FunctionComponent, useEffect, useState } from 'react';

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
import { EditBudgetProcessApproval } from './EditBudgetProcessApproval';
import { EditBudgetProcessRelease } from './EditBudgetProcessRelease';
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

    const [tab, setTab] = useState<'approval' | 'release'>('approval');
    const { data: budget } = useGetBudget(budgetProcess.id);
    const { data: availableRounds, isFetching: isFetchingAvailableRounds } =
        useAvailableRoundsForUpdate(
            budgetProcess.campaign_id,
            budgetProcess.id,
        );

    const { mutate: confirm } = useEditBudgetProcess();
    const schema = useEditBudgetProcessSchema();
    const formik = useFormik<Partial<BudgetDetail>>({
        initialValues: {},
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: async newValues => {
            confirm({
                id: budgetProcess.id,
                ...newValues,
                rounds: newValues.rounds,
            });
        },
    });

    useEffect(() => {
        if (budget) {
            const newValues: BudgetDetail = {
                ...budget,
                rounds:
                    budget.rounds?.map(round => ({
                        ...round,
                        value: round.id,
                        label: formatRoundNumber(round.number),
                    })) || [],
            };
            if (!isEqual(formik.values, newValues)) {
                formik.setValues(newValues);
            }
        }
        // only change formik values while fetching budget detail
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budget]);
    const { values, isSubmitting, isValid } = formik;
    const isFormChanged = !isEqual(values, budget);
    const allowConfirm = !isSubmitting && isValid && isFormChanged;
    console.log('values', values);
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
                        <Grid item xs={6}>
                            <Field
                                label={formatMessage(MESSAGES.labelRound)}
                                name="rounds"
                                component={MultiSelect}
                                options={availableRounds}
                                returnFullObject
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Tabs
                                value={tab}
                                onChange={(_, newtab) => setTab(newtab)}
                            >
                                <Tab
                                    value="approval"
                                    label={formatMessage(
                                        MESSAGES.budgetApproval,
                                    )}
                                />
                                <Tab
                                    value="release"
                                    label={formatMessage(MESSAGES.fundsRelease)}
                                />
                            </Tabs>
                        </Grid>
                        {tab === 'approval' && (
                            <EditBudgetProcessApproval budget={budget} />
                        )}
                        {tab === 'release' && <EditBudgetProcessRelease />}
                    </Grid>
                </ConfirmCancelModal>
            )}
        </FormikProvider>
    );
};
const modalWithIcon = makeFullModal(EditBudgetProcessModal, EditIconButton);

export { modalWithIcon as EditBudgetProcessModal };
