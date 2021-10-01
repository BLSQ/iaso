import React from 'react';
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

import { useSelector } from 'react-redux';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../Styles';

const R1Popper = ({ campaign, handleClick, open, anchorEl, setDialogOpen }) => {
    const classes = useStyles();
    // We don't want to show the edit button if there is no connected user
    const isLogged = useSelector(state => Boolean(state.users.current));
    const id = open ? `campaign-popover-${campaign.id}` : undefined;
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
                        onClick={() => handleClick()}
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
                            {campaign.R1Start.format('L')}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.endDate} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.R1End.format('L')}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.raStatus} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.risk_assessment_status}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.budgetStatus} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.budget_status}
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-end">
                            <FormattedMessage {...MESSAGES.vaccine} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.vacine}
                        </Grid>
                        <Grid item sm={12} container justifyContent="flex-end">
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

R1Popper.propTypes = {
    campaign: PropTypes.object.isRequired,
    handleClick: PropTypes.func.isRequired,
    setDialogOpen: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    anchorEl: PropTypes.object.isRequired,
};

export { R1Popper };
