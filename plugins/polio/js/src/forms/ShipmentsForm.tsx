import { useFormikContext } from 'formik';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid } from '@material-ui/core';
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
    const { formatMessage } = useSafeIntl();
    const { setFieldValue } = useFormikContext();
    const { shipments = [] } = round ?? {};
    const [enableRemoveButton, setEnableRemoveButton] =
        useState<boolean>(false);

    const lastIndex = shipments.length >= 1 && shipments.length - 1;

    const handleAddShipment = () => {
        const newShipments = [...shipments, {}];
        setFieldValue(`${accessor}.shipments`, newShipments);
    };

    const handleRemoveLastShipment = useCallback(() => {
        const newShipments = [...shipments];
        newShipments.pop();
        setFieldValue(`${accessor}.shipments`, newShipments);
    }, [accessor, setFieldValue, shipments]);

    // determine whether to show delete button or not
    useEffect(() => {
        if (Number.isInteger(lastIndex)) {
            const lastShipment = shipments[lastIndex as number];
            if (
                lastIndex >= 0 &&
                !lastShipment.vaccine_name &&
                !lastShipment.po_numbers &&
                !lastShipment.doses_received &&
                !lastShipment.reception_pre_alert &&
                !lastShipment.estimated_arrival_date &&
                !lastShipment.date_reception
            ) {
                setEnableRemoveButton(true);
            } else {
                setEnableRemoveButton(false);
            }
        } else {
            setEnableRemoveButton(false);
        }
    }, [lastIndex, shipments]);

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

            <Grid
                container
                item
                xs={12}
                spacing={2}
                direction="column"
                justifyContent="flex-end"
            >
                <Grid container direction="row" justifyContent="flex-end">
                    <Box mt={2} mb={1}>
                        <Button onClick={handleAddShipment}>
                            {formatMessage(MESSAGES.addShipment)}
                        </Button>
                        <Button
                            onClick={handleRemoveLastShipment}
                            disabled={!enableRemoveButton}
                        >
                            {formatMessage(MESSAGES.removeLastShipment)}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
