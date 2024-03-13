import React, { useCallback, FunctionComponent } from 'react';

import { IconButton, Grid, Button, Popper, Paper, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSafeIntl, getTableUrl } from 'bluesquare-components';

import { useSelector } from 'react-redux';
import { User } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../../constants/messages';
import { useStyles } from '../Styles';
import { CsvButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';
import { CalendarRound, MappedCampaign } from '../types';

const groupsForCampaignRound = (campaign, round) => {
    if (!campaign.separate_scopes_per_round) {
        return campaign.scopes
            .filter(scope => scope.group)
            .map(scope => scope.group.id)
            .flat();
    }
    if (round) {
        return round.scopes
            .filter(scope => scope.group)
            .map(scope => scope.group.id)
            .flat();
    }
    return [];
};

type Props = {
    campaign: MappedCampaign;
    handleClose: () => void;
    open: boolean;
    anchorEl: HTMLElement | undefined;
    // eslint-disable-next-line no-unused-vars
    setDialogOpen: (open: boolean) => void;
    round: CalendarRound;
};

export const RoundPopper: FunctionComponent<Props> = ({
    campaign,
    handleClose,
    open,
    anchorEl,
    setDialogOpen,
    round,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    // We don't want to show the edit button if there is no connected user
    const isLogged = useSelector((state: { users: { current: User } }) =>
        Boolean(state.users.current),
    );
    const id = open ? `campaign-popover-${campaign.id}-${round.id}` : undefined;
    const groupIds = groupsForCampaignRound(campaign, round).join(',');
    const urlParams = {
        round: round.id,
        app_id: 'com.poliooutbreaks.app',
    };
    const url = getTableUrl(
        'polio/campaigns/csv_campaign_scopes_export',
        urlParams,
    );

    const getMessage = useCallback(
        key => (MESSAGES[key] ? formatMessage(MESSAGES[key]) : key),
        [formatMessage],
    );
    return (
        <Popper
            id={id}
            open={open}
            anchorEl={anchorEl}
            className={classes.popper}
        >
            <Paper elevation={1}>
                <Box p={2}>
                    <IconButton
                        onClick={() => handleClose()}
                        className={classes.popperClose}
                        size="small"
                    >
                        <CloseIcon color="primary" />
                    </IconButton>
                    <Grid container spacing={1}>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.startDate)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {round.start && round.start.format('L')}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.endDate)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {round.end && round.end.format('L')}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.raStatus)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {getMessage(
                                campaign.original.risk_assessment_status,
                            )}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.budgetStatus)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {getMessage(campaign.original.budget_status)}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.vaccine)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.vaccines}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.preventiveShort)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.isPreventive
                                ? formatMessage(MESSAGES.yes)
                                : formatMessage(MESSAGES.no)}
                        </Grid>
                        <Grid
                            item
                            sm={12}
                            container
                            justifyContent={
                                isLogged ? 'space-between' : 'flex-end'
                            }
                        >
                            {groupIds && (
                                <CsvButton csvUrl={url} variant="text" />
                            )}
                            {isLogged && (
                                <Button
                                    onClick={() => setDialogOpen(true)}
                                    size="small"
                                    color="primary"
                                >
                                    {formatMessage(MESSAGES.edit)}
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Popper>
    );
};
