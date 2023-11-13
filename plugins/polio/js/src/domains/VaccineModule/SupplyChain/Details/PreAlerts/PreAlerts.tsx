import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import {
    AddButton,
    MENU_HEIGHT_WITH_TABS,
    useSafeIntl,
} from 'bluesquare-components';
import { useFormikContext } from 'formik';
import { PreAlert } from './PreAlert';
import MESSAGES from '../../messages';

type Props = { className?: string; items?: any[] };
// const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

const emptyPreAlert = {
    date_reception: undefined,
    po_number: undefined,
    eta: undefined,
    lot_number: undefined,
    expiration_date: undefined,
    doses_shipped: undefined,
    doses_recieved: undefined,
    doses_per_vial: undefined,
};

export const PreAlerts: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    // const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    // TODO manage errors
    const { values, setFieldValue } = useFormikContext<any>();

    return (
        <Box className={className}>
            <Box mb={4}>
                <Grid container justifyContent="space-between">
                    <Typography variant="h5">
                        {formatMessage(MESSAGES.pre_alerts)}
                    </Typography>
                    <Box mr={2}>
                        <AddButton
                            message={MESSAGES.addPreAlert}
                            onClick={() => {
                                setFieldValue('pre_alerts', [
                                    ...values.pre_alerts,
                                    emptyPreAlert,
                                ]);
                            }}
                        />
                    </Box>
                </Grid>
            </Box>
            <Box
                style={{
                    height: `calc(100vh - ${MENU_HEIGHT_WITH_TABS + 200}px)`,
                    overflow: 'scroll',
                }}
            >
                {items.map((_, index) => {
                    return <PreAlert index={index} key={index} />;
                })}
            </Box>
        </Box>
    );
};
