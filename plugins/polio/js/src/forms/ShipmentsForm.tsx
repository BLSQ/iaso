import { useFormikContext } from 'formik';
import React, { FunctionComponent, useEffect, useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Clear';
import { Box, Button, Tab, Tabs } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Optional } from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';
import { ShipmentForm } from './ShipmentForm';

type Props = {
    roundIndex: number;
    round: any;
};

export const ShipmentsForm: FunctionComponent<Props> = ({
    roundIndex,
    round,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { setFieldValue } = useFormikContext();
    // const selectedRound = rounds[roundIndex];
    const { shipments } = round;

    const handleAddShipment = () => {
        const newShipments = [...shipments, {}]; // TODO add shipment key values
        setFieldValue(`rounds[${roundIndex}.shipments]`, newShipments);
    };

    return (
        <>
            {shipments.map((shipment, index) => (
                <Box mt={2}>
                    <ShipmentForm
                        index={index}
                        roundIndex={roundIndex}
                        round={round}
                    />
                </Box>
            ))}
            {/* TODO refactor to add shipment */}
            <Button
                className={classes.addRoundButton}
                size="small"
                color="secondary"
                onClick={handleAddShipment}
                startIcon={<AddIcon fontSize="small" />}
                variant="outlined"
            >
                +
            </Button>
        </>
    );
};
