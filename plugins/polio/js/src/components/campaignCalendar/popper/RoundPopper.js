import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import {
    IconButton,
    Grid,
    Button,
    Popper,
    Paper,
    Box,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useSafeIntl } from 'bluesquare-components';

import { useSelector } from 'react-redux';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../Styles';
import { CsvButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton.tsx';

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

const RoundPopper = ({
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
    const isLogged = useSelector(state => Boolean(state.users.current));
    const id = open ? `campaign-popover-${campaign.id}-${round.id}` : undefined;
    const groupIds = groupsForCampaignRound(campaign, round).join(',');
    const url = `/api/orgunits/?csv=true&group=${groupIds}&app_id=com.poliooutbreaks.app`;
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
                            <FormattedMessage {...MESSAGES.startDate} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {round.start.format('L')}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.endDate} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {round.end.format('L')}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.raStatus} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {getMessage(
                                campaign.original.risk_assessment_status,
                            )}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.budgetStatus} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {getMessage(campaign.original.budget_status)}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.vaccine} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.vaccines}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.preventiveShort} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.isPreventive ? (
                                <FormattedMessage {...MESSAGES.yes} />
                            ) : (
                                <FormattedMessage {...MESSAGES.no} />
                            )}
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
                                    <FormattedMessage {...MESSAGES.edit} />
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Popper>
    );
};

RoundPopper.propTypes = {
    campaign: PropTypes.object.isRequired,
    handleClose: PropTypes.func.isRequired,
    setDialogOpen: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    anchorEl: PropTypes.object.isRequired,
    round: PropTypes.object.isRequired,
};

export { RoundPopper };
