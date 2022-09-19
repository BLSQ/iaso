import { useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';
import AddIcon from '@material-ui/icons/Add';
import { Box, Fab, Grid } from '@material-ui/core';
// import { useStyles } from '../styles/theme';
import { ShipmentForm } from './ShipmentForm';

type Props = {
    roundIndex: number;
    round: any;
    selectedVaccineIndex: number;
};

export const ShipmentsForm: FunctionComponent<Props> = ({
    roundIndex,
    round,
    selectedVaccineIndex,
}) => {
    // const classes: Record<string, string> = useStyles();
    const { setFieldValue } = useFormikContext();
    // const selectedRound = rounds[roundIndex];
    const { shipments = [{}] } = round?.vaccines[selectedVaccineIndex] ?? {};

    const handleAddShipment = () => {
        const newShipments = [...shipments, {}]; // TODO add shipment key values
        setFieldValue(
            `rounds[${roundIndex}]vaccines[${selectedVaccineIndex}].shipments`,
            newShipments,
        );
    };

    return (
        <>
            {shipments.map((shipment, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Grid item xs={12} key={`shipment${index}`}>
                    <Box mt={2}>
                        <ShipmentForm
                            index={index}
                            roundIndex={roundIndex}
                            round={round}
                            selectedVaccineIndex={selectedVaccineIndex}
                        />
                    </Box>
                </Grid>
            ))}

            {/* TODO refactor to add shipment */}
            <Fab size="small" onClick={handleAddShipment}>
                <AddIcon />
            </Fab>
        </>
    );
};
