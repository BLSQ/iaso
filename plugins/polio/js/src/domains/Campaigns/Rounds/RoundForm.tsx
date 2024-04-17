import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';
import { DateInput, NumberInput } from '../../../components/Inputs';
import MESSAGES from '../../../constants/messages';
import { CampaignFormValues } from '../../../constants/types';
import { RoundDates } from './RoundDates/RoundDates';

type Props = { roundNumber: number };

export const RoundForm: FunctionComponent<Props> = ({ roundNumber }) => {
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
        setFieldValue,
    } = useFormikContext<CampaignFormValues>();
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12} md={6} item>
                    <RoundDates
                        roundNumber={roundNumber}
                        roundIndex={roundIndex}
                        setParentFieldValue={setFieldValue}
                        parentFieldValue={rounds[roundIndex]}
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.percentage_covered_target_population,
                        )}
                        name={`rounds[${roundIndex}].percentage_covered_target_population`}
                        component={NumberInput}
                    />
                    <Box mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.targetPopulation)}
                            name={`rounds[${roundIndex}].target_population`}
                            component={NumberInput}
                        />
                    </Box>
                </Grid>
                <Grid xs={12} md={6} item>
                    <Field
                        label={formatMessage(MESSAGES.mop_up_started_at)}
                        name={`rounds[${roundIndex}].mop_up_started_at`}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.mop_up_ended_at)}
                        name={`rounds[${roundIndex}].mop_up_ended_at`}
                        component={DateInput}
                        fullWidth
                    />
                </Grid>
            </Grid>
        </>
    );
};
