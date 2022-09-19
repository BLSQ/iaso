/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import RemoveIcon from '@material-ui/icons/Clear';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';
import { DateInput, TextInput } from '../components/Inputs';

export type Shipment = {
    date_of_reception: string | number; // Date format to calrify with API
    estimated_date_of_arrival: string | number; // Date format to calrify with API
    reception_pre_start: string | number; // Date format to calrify with API
    doses_shipped: number;
    po_numbers: number;
};

type Props = {
    roundIndex: number;
    index: number;
    round: any;
    selectedVaccineIndex: number;
};

export const ShipmentForm: FunctionComponent<Props> = ({
    index,
    roundIndex,
    round,
    selectedVaccineIndex,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { shipments = [{}] } = round?.vaccines[selectedVaccineIndex] ?? {};
    const { setFieldValue } = useFormikContext();

    const handleDeleteShipment = useCallback(() => {
        const updatedShipments = [...shipments];
        setFieldValue(
            `rounds[${roundIndex}]vaccines[${selectedVaccineIndex}].shipments`,
            updatedShipments,
        );
    }, [roundIndex, selectedVaccineIndex, setFieldValue, shipments]);
    return (
        <>
            <Grid
                container
                item
                xs={12}
                spacing={2}
                justifyContent="space-between"
            >
                <Grid item xs={2}>
                    <Field
                        label={formatMessage(MESSAGES.poNumbers)}
                        name={`rounds[${roundIndex}].vaccines[${selectedVaccineIndex}].shipment[${index}].po_numbers`}
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item xs={2}>
                    <Field
                        label={formatMessage(MESSAGES.dosesShipped)}
                        name={`rounds[${roundIndex}].vaccines[${selectedVaccineIndex}].shipment[${index}].doses_shipped`}
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item xs={2}>
                    <Field
                        label={formatMessage(MESSAGES.receptionPreAlert)}
                        name={`rounds[${roundIndex}].vaccines[${selectedVaccineIndex}].shipment[${index}].reception_pre_alert`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item xs={2}>
                    <Field
                        label={formatMessage(MESSAGES.estimatedDateOfArrival)}
                        name={`rounds[${roundIndex}].vaccines[${selectedVaccineIndex}].shipment[${index}].estimated_date_of_arrival`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item xs={2}>
                    <Field
                        label={formatMessage(
                            MESSAGES.receptionVaccineArrivalReport,
                        )}
                        name={`rounds[${roundIndex}].vaccines[${selectedVaccineIndex}].shipment[${index}].date_reception`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item xs={1}>
                    <RemoveIcon onClick={handleDeleteShipment} />
                </Grid>
            </Grid>
        </>
    );
};
