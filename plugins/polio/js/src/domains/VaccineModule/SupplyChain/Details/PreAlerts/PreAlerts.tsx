import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography, makeStyles } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput, TextInput } from '../../../../../components/Inputs';
import { Router } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/general';

type Props = { className?: string; router: Router };
const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

export const PreAlerts: FunctionComponent<Props> = ({ className, router }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    // TODO manage errors, allowConfirm
    const { values } = useFormikContext<any>();

    return (
        <Box className={className}>
            <Box mb={4}>
                <Typography variant="h5">PreAlerts</Typography>
            </Box>
            <Grid container spacing={2}>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Pre-alert reception"
                            name="pre_alerts[0].date_pre_alert_reception"
                            component={DateInput}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="PO number"
                            name="pre_alerts[0].po_number"
                            component={TextInput}
                            shrinkLabel={false}
                            touchOnFocus={false}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Lot number"
                            name="pre_alerts[0].lot_number"
                            component={NumberInput}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Estimated arrival time"
                            name="pre_alerts[0].estimated_arrival_time"
                            component={DateInput}
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Expiration date"
                                name="pre_alerts[0].expiration_date"
                                component={DateInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Doses shipped"
                                name="pre_alerts[0].doses_shipped"
                                component={NumberInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Doses received"
                                name="pre_alerts[0].doses_received"
                                component={NumberInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};
