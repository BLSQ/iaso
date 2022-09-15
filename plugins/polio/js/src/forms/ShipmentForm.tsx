/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Button, Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
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
};

export const ShipmentForm: FunctionComponent<Props> = ({
    index,
    roundIndex,
    round,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { shipments } = round;
    const { setFieldValue } = useFormikContext();

    const handleDeleteShipment = useCallback(() => {
        const updatedShipments = [...shipments];
        setFieldValue(`rounds[${roundIndex}].shipments`, updatedShipments);
    }, [roundIndex, setFieldValue, shipments]);
    return (
        <>
            <Grid container item xs={12} spacing={2}>
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name={`round[${roundIndex}].shipment[${index}].po_numbers`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name={`round[${roundIndex}].shipment[${index}].doses_shipped`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name={`round[${roundIndex}].shipment[${index}].reception_pre_start`}
                    component={DateInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name={`round[${roundIndex}].shipment[${index}].estimated_date_of_arrival`}
                    component={DateInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name={`round[${roundIndex}].shipment[${index}].date_of_reception`}
                    component={DateInput}
                    className={classes.input}
                />
            </Grid>
            <Button onClick={handleDeleteShipment}>DELETE SHIPMENT</Button>
        </>
    );
};
