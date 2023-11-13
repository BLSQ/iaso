import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import { useFormikContext } from 'formik';
import { AddButton, useSafeIntl } from 'bluesquare-components';
import { VaccineArrivalReport } from './VaccineArrivalReport';
import MESSAGES from '../../messages';

type Props = { className?: string; items?: any[] };
// const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));
const emptyArrivalReport = {
    report_date: undefined,
    po_number: undefined,
    lot_number: undefined,
    expiration_date: undefined,
    doses_shipped: undefined,
    doses_received: undefined,
    doses_per_vial: undefined,
};
export const VaccineArrivalReports: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    // const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const { values, setFieldValue } = useFormikContext<any>();

    return (
        <Box className={className}>
            <Box mb={4}>
                <Grid container justifyContent="space-between">
                    <Typography variant="h5">
                        {formatMessage(MESSAGES.varsTitle)}
                    </Typography>
                    <AddButton
                        message={MESSAGES.addVar}
                        onClick={() => {
                            setFieldValue('vars', [
                                ...values.vars,
                                emptyArrivalReport,
                            ]);
                        }}
                    />
                </Grid>
            </Box>
            {items.map((_, index) => {
                return <VaccineArrivalReport index={index} key={index} />;
            })}
        </Box>
    );
};
