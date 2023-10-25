/* eslint-disable camelcase */
import React, { FunctionComponent, useEffect, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Grid } from '@mui/material';
import { Field, useFormikContext } from 'formik';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { DateInput } from '../../../components/Inputs';
import { polioVaccines } from '../../../constants/virus';
import { MultilineText } from '../../../components/Inputs/MultilineText';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';
import { DebouncedTextInput } from '../../../components/Inputs/DebouncedTextInput';

type Props = {
    index: number;
    accessor: string;
    roundIndex: number;
};

export const shipmentFieldNames = [
    'vaccine_name',
    'po_numbers',
    'vials_received',
    'estimated_arrival_date',
    'date_reception',
    'reception_pre_alert',
    'comment',
];

export const ShipmentForm: FunctionComponent<Props> = ({
    index,
    accessor,
    roundIndex,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values = {} as any, setFieldTouched } = useFormikContext();
    const fieldValues = useMemo(
        () => values?.rounds?.[roundIndex].shipments?.[index],
        [index, roundIndex, values?.rounds],
    );
    useEffect(() => {
        // Using every to be able to break the loop
        shipmentFieldNames.every(key => {
            if (fieldValues?.[key]) {
                shipmentFieldNames.forEach(name => {
                    setFieldTouched(
                        `${accessor}.shipments[${index}].${name}`,
                        true,
                    );
                });
                // break the loop if any field has a value
                return false;
            }
            return true;
        });
    }, [accessor, fieldValues, index, setFieldTouched]);

    const disableComment = !(
        values?.round?.[roundIndex]?.shipments?.[index]?.vaccine_name &&
        values?.round?.[roundIndex]?.shipments?.[index]?.po_numbers &&
        values?.round?.[roundIndex]?.shipments?.[index]?.vials_received &&
        values?.round?.[roundIndex]?.shipments?.[index]?.reception_pre_alert &&
        values?.round?.[roundIndex]?.shipments?.[index]
            ?.estimated_arrival_date &&
        values?.round?.[roundIndex]?.shipments?.[index]?.date_reception
    );

    return (
        <>
            <Grid
                container
                item
                xs={12}
                spacing={2}
                justifyContent="flex-start"
            >
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.vaccine)}
                        name={`${accessor}.shipments[${index}].vaccine_name`}
                        className={classes.input}
                        options={polioVaccines}
                        clearable={false}
                        component={SingleSelect}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.poNumbers)}
                        name={`${accessor}.shipments[${index}].po_numbers`}
                        component={DebouncedTextInput}
                        debounceTime={300}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.vialsShipped)}
                        name={`${accessor}.shipments[${index}].vials_received`}
                        component={DebouncedTextInput}
                        debounceTime={300}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.receptionPreAlert)}
                        name={`${accessor}.shipments[${index}].reception_pre_alert`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.estimatedDateOfArrival)}
                        name={`${accessor}.shipments[${index}].estimated_arrival_date`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(
                            MESSAGES.receptionVaccineArrivalReport,
                        )}
                        name={`${accessor}.shipments[${index}].date_reception`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.comment)}
                        name={`${accessor}.shipments[${index}].comment`}
                        component={MultilineText}
                        className={classes.input}
                        debounceTime={1000}
                        disabled={disableComment}
                    />
                </Grid>
            </Grid>
        </>
    );
};
