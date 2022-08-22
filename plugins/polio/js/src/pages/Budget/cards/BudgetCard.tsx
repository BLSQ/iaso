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
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import classnames from 'classnames';

import { BUDGET_DETAILS } from '../../../constants/routes';
import { IntlFormatMessage } from '../../../../../../../hat/assets/js/apps/Iaso/types/intl';
import MESSAGES from '../../../constants/messages';
import { BudgetEvent } from '../../../constants/types';
import { WARNING_COLOR } from '../../../styles/constants';

export type CardCampaign = {
    id: string;
    obr_name: string;
    country: number;
    top_level_org_unit_name: string;
    last_budget_event: BudgetEvent;
};

type Props = {
    campaign: CardCampaign;
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
export const BudgetCard: FunctionComponent<Props> = ({ campaign }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();

    const status = campaign.last_budget_event?.status;
    const type = campaign.last_budget_event?.type;
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
                                {campaign.obr_name}
                            </Typography>
                            <Box
                                className={classnames(
                                    classes.status,
                                    status && classes[status],
                                )}
                            >
                                {status
                                    ? formatMessage(MESSAGES[status])
                                    : formatMessage(MESSAGES.noBudgetSubmitted)}
                            </Box>
                        </Box>
                        <Typography variant="body2">
                            {formatMessage(MESSAGES.latestEvent)}:{' '}
                            {type ? formatMessage(MESSAGES[type]) : '--'}
                        </Typography>
                        <Typography variant="body2" className={classes.country}>
                            {campaign.top_level_org_unit_name}
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
                        url={`${baseUrl}/campaignId/${campaign.id}/campaignName/${campaign.obr_name}/country/${campaign.country}`}
                    />
                </Grid>
            </Grid>
        </Card>
    );
};
