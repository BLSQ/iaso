/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import {
    makeStyles,
    Typography,
    Card,
    Grid,
    Divider,
    Box,
    CardContent,
} from '@material-ui/core';
import {
    useSafeIntl,
    IconButton as IconButtonComponent,
    IntlFormatMessage,
} from 'bluesquare-components';
import classnames from 'classnames';

import { BUDGET_DETAILS } from '../../../constants/routes';
import MESSAGES from '../../../constants/messages';
import { WARNING_COLOR } from '../../../styles/constants';
import { Budget } from '../types';

type Props = {
    budget: Budget;
};

const useStyles = makeStyles(theme => ({
    cardContent: {
        padding: `${theme.spacing(1)}px !important`,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: theme.spacing(0.5),
        width: '60%',
        alignItems: 'center',
    },
    status: {
        display: 'flex',
        justifyContent: 'flex-end',
        width: '40%',
        paddingTop: 6,
    },
    rejected: { color: theme.palette.error.main },
    validated: { color: theme.palette.success.main },
    validation_ongoing: { color: WARNING_COLOR },
    country: { color: theme.palette.grey[700], marginTop: theme.spacing(0.5) },
}));

const baseUrl = BUDGET_DETAILS;
export const BudgetCard: FunctionComponent<Props> = ({ budget }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();

    const status = budget?.current_state?.label;
    return (
        <Card>
            <Grid container>
                <Grid item xs={10}>
                    <CardContent className={classes.cardContent}>
                        <Box display="flex">
                            <Typography
                                variant="h6"
                                className={classes.title}
                                noWrap
                            >
                                {budget.obr_name}
                            </Typography>
                            <Box
                                className={classnames(
                                    classes.status,
                                    status && classes[status],
                                )}
                            >
                                {status ||
                                    formatMessage(MESSAGES.noBudgetSubmitted)}
                            </Box>
                        </Box>
                        <Typography variant="body2" className={classes.country}>
                            {budget.country_name}
                        </Typography>
                    </CardContent>
                </Grid>
                <Grid
                    container
                    item
                    xs={2}
                    direction="column"
                    justifyContent="center"
                >
                    <Divider orientation="vertical" />

                    <IconButtonComponent
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.details}
                        url={`${baseUrl}/campaignName/${budget.obr_name}/campaignId/${budget.id}`}
                    />
                </Grid>
            </Grid>
        </Card>
    );
};
