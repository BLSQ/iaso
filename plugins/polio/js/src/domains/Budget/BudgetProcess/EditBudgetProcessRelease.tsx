import { Box, Grid } from '@mui/material';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';

import { NumberInput, useSafeIntl } from 'bluesquare-components';
import { DateInput, PaymentField } from '../../../components/Inputs';
import MESSAGES from '../messages';
import { BudgetDetail } from '../types';

export const EditBudgetProcessRelease: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const { setFieldValue } = useFormikContext<BudgetDetail>();
    return (
        <>
            <Grid item xs={12} lg={6}>
                <Grid item xs={12}>
                    <Box mb={2}>
                        <Field
                            name="payment_mode"
                            component={PaymentField}
                            fullWidth
                            shrinkLabel={false}
                        />
                    </Box>
                    <Field
                        label={formatMessage(MESSAGES.disbursedToCoWho)}
                        name="who_disbursed_to_co_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.disbursedToMohWho)}
                        name="who_disbursed_to_moh_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.disbursedToCoUnicef)}
                        name="unicef_disbursed_to_co_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.disbursedToMohUnicef)}
                        name="unicef_disbursed_to_moh_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.district_count)}
                            name="district_count"
                            component={NumberInput}
                            onChange={newValue => {
                                setFieldValue('district_count', newValue);
                            }}
                        />
                    </Box>

                    <Field
                        label={formatMessage(MESSAGES.noRegretFund)}
                        name="no_regret_fund_amount"
                        component={NumberInput}
                        withMarginTop
                        onChange={newValue => {
                            setFieldValue('no_regret_fund_amount', newValue);
                        }}
                    />
                </Grid>
            </Grid>
        </>
    );
};
