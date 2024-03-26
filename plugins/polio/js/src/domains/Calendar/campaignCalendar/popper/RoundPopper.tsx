import React, { FunctionComponent } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Grid, IconButton, Paper, Popper } from '@mui/material';
import { getTableUrl, useSafeIntl } from 'bluesquare-components';

import { useSelector } from 'react-redux';
import { CsvButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { CalendarRound, MappedCampaign, ReduxState } from '../types';

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
const styles: SxStyles = {
    popper: {
        zIndex: 500,
        width: 400,
        backgroundColor: 'white',
    },
    popperClose: {
        position: 'absolute',
        top: theme => theme.spacing(1),
        right: theme => theme.spacing(1),
    },
    editButton: {
        marginLeft: 'auto',
    },
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
    const { formatMessage, formatNumber } = useSafeIntl();
    // We don't want to show the edit button if there is no connected user
    const isLogged = useSelector((state: ReduxState) =>
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
    return (
        <Popper id={id} open={open} anchorEl={anchorEl} sx={styles.popper}>
            <Paper elevation={1}>
                <Box pt={6} pb={2} pr={2} pl={2}>
                    <IconButton
                        onClick={() => handleClose()}
                        sx={styles.popperClose}
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
                            {formatMessage(MESSAGES.target_population)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {formatNumber(round.target_population)}
                        </Grid>

                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.preventiveShort)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.isPreventive
                                ? formatMessage(MESSAGES.yes)
                                : formatMessage(MESSAGES.no)}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.description)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.description || '--'}
                        </Grid>
                        <Grid item sm={12} container>
                            {groupIds && (
                                <CsvButton csvUrl={url} variant="text" />
                            )}
                            {isLogged && (
                                <Button
                                    onClick={() => setDialogOpen(true)}
                                    size="small"
                                    color="primary"
                                    sx={styles.editButton}
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
