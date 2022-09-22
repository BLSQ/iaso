import { useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { IconButton } from 'bluesquare-components';
import AddIcon from '@material-ui/icons/Add';
import { Box, Grid } from '@material-ui/core';
import { ShipmentForm } from './ShipmentForm';
import MESSAGES from '../constants/messages';

type Props = {
    round: any;
    accessor: string;
};

export const ShipmentsForm: FunctionComponent<Props> = ({
    round,
    accessor,
}) => {
    const { setFieldValue } = useFormikContext();
    const { shipments = [] } = round ?? {};

    const handleAddShipment = () => {
        const newShipments = [...shipments, {}];
        setFieldValue(`${accessor}.shipments`, newShipments);
    };

    return (
        <>
            {shipments.length > 0 &&
                shipments.map((_shipment, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Grid item xs={12} key={`shipment${index}`}>
                        <Box mt={2}>
                            <ShipmentForm index={index} accessor={accessor} />
                        </Box>
                    </Grid>
                ))}
            {shipments.length === 0 && (
                <Grid item xs={12} key={`shipment${0}`}>
                    <Box mt={2}>
                        <ShipmentForm index={0} accessor={accessor} />
                    </Box>
                </Grid>
            )}
            <Grid
                container
                item
                xs={12}
                spacing={2}
                direction="column"
                justifyContent="flex-end"
            >
                <IconButton
                    overrideIcon={AddIcon}
                    tooltipMessage={MESSAGES.addShipment}
                    onClick={handleAddShipment}
                />
            </Grid>
        </>
    );
};
