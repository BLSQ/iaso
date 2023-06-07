import React, { FunctionComponent } from 'react';
import { Field, FormikProvider, useFormik, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Divider, Grid, Typography } from '@material-ui/core';
import { isEqual } from 'lodash';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../constants/messages';
import { DateInput } from '../../Inputs';
import { Campaign, Round } from '../../../constants/types';
import { ReasonForDelayModal } from '../ReasonForDelayModal/ReasonForDelayModal';
import { ReasonForDelayPopper } from '../ReasonForDelayModal/ReasonForDelayPopper';
import { useRoundDateHistorySchema } from '../ReasonForDelayModal/validation';

type Props = {
    roundIndex: number;
    setParentFieldValue: (
        // eslint-disable-next-line no-unused-vars
        field: string,
        // eslint-disable-next-line no-unused-vars
        value: any,
        // eslint-disable-next-line no-unused-vars
        shouldValidate?: boolean | undefined,
    ) => void;
    parentFieldValue: Round;
};

export const RoundDates: FunctionComponent<Props> = ({
    roundIndex,
    setParentFieldValue,
    parentFieldValue,
    // TODO pass parentFieldValue to allow spreading
}) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
        initialValues,
    } = useFormikContext<Campaign>();
    const currentStartDate = rounds?.[roundIndex]?.started_at;
    const currentEndDate = rounds?.[roundIndex]?.ended_at;
    const hasInitialData = Boolean(
        initialValues.rounds?.[roundIndex]?.started_at &&
            initialValues.rounds?.[roundIndex]?.ended_at,
    );
    const save = ({ startDate, endDate, reason, user }, helpers) => {
        // TODO spread parentFieldValue.datelogs and add new value i.o replacing
        setParentFieldValue(`round[${roundIndex}]`, {
            ...rounds[roundIndex],
            started_at: startDate,
            ended_at: endDate,
        });
        setParentFieldValue(`round[${roundIndex}].datelogs`, [
            ...(parentFieldValue?.datelogs ?? []),
            {
                reason,
                user,
                previous_started_at: currentStartDate,
                previous_ended_at: currentEndDate,
                started_at: startDate,
                ended_at: endDate,
            },
        ]);
        helpers.setSubmitting(false);
    };

    const schema = useRoundDateHistorySchema(rounds, rounds[roundIndex]);

    const formik = useFormik({
        initialValues: {
            startDate: currentStartDate,
            endDate: currentEndDate,
            reason: null,
            user: currentUser.id,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });
    const isFormChanged =
        !isEqual(formik.values.startDate, formik.initialValues.startDate) ||
        !isEqual(formik.values.endDate, formik.initialValues.endDate);

    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged; // && stuff

    return (
        <>
            {!hasInitialData && (
                <>
                    <Field
                        label={formatMessage(MESSAGES.startDate)}
                        name={`rounds[${roundIndex}].started_at`}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.endDate)}
                        name={`rounds[${roundIndex}].ended_at`}
                        component={DateInput}
                        fullWidth
                    />
                </>
            )}
            {hasInitialData && (
                <FormikProvider value={formik}>
                    <Box mb={2}>
                        <Divider />
                        <Grid container>
                            <Grid item xs={8}>
                                <Box ml={2} mb={2} mt={2}>
                                    <Grid container>
                                        <Grid item xs={4}>
                                            <Typography variant="button">
                                                {`${formatMessage(
                                                    MESSAGES.startDate,
                                                )}: `}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <Typography variant="button">
                                                {`${currentStartDate ?? '--'}`}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Box ml={2} mb={2}>
                                    <Grid container>
                                        <Grid item xs={4}>
                                            <Typography variant="button">
                                                {`${formatMessage(
                                                    MESSAGES.endDate,
                                                )}: `}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <Typography variant="button">
                                                {`${currentEndDate ?? '--'}`}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                            <Grid
                                container
                                item
                                xs={4}
                                alignContent="center"
                                justifyContent="flex-end"
                            >
                                <Box style={{ display: 'flex' }}>
                                    <ReasonForDelayPopper />
                                    <Box
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <ReasonForDelayModal
                                            iconProps={{}}
                                            allowConfirm={allowConfirm}
                                        />
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                        <Divider />
                    </Box>
                </FormikProvider>
            )}
        </>
    );
};
