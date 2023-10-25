import { useFormikContext } from 'formik';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid } from '@mui/material';
import { shipmentFieldNames, ShipmentForm } from './ShipmentForm';
import MESSAGES from '../../../constants/messages';

type Props = {
    round: any;
    accessor: string;
    roundIndex: number;
};

export const ShipmentsForm: FunctionComponent<Props> = ({
    round,
    accessor,
    roundIndex,
}) => {
    const { formatMessage } = useSafeIntl();
    const { setFieldValue, setFieldTouched } = useFormikContext();
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
        shipmentFieldNames.forEach(field => {
            setFieldTouched(
                `${accessor}.shipments[${newShipments.length}].${field}`,
                false,
            );
        });
    }, [accessor, setFieldTouched, setFieldValue, shipments]);

    // determine whether to show delete button or not

    useEffect(() => {
        if (Number.isInteger(lastIndex)) {
            if (lastIndex >= 0) {
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
                            <ShipmentForm
                                index={index}
                                accessor={accessor}
                                roundIndex={roundIndex}
                            />
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
                <Box mt={2} mb={2}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-end"
                        spacing={2}
                    >
                        <Grid item>
                            <Button
                                onClick={handleAddShipment}
                                variant="outlined"
                            >
                                {formatMessage(MESSAGES.addShipment)}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                onClick={handleRemoveLastShipment}
                                disabled={!enableRemoveButton}
                                variant="outlined"
                            >
                                {formatMessage(MESSAGES.removeLastShipment)}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </>
    );
};
