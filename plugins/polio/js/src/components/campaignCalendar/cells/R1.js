import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { FormattedMessage } from 'react-intl';

import { TableCell, Paper, IconButton, Grid, Button } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import { CreateEditDialog } from '../../Dashboard';
import MESSAGES from '../../../constants/messages';

import { useStyles } from '../Styles';

const R1Cell = ({ colSpan, campaign }) => {
    const classes = useStyles();
    const [poperOpen, setPoperOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
            colSpan={colSpan}
        >
            <span
                onClick={() => setPoperOpen(true)}
                role="button"
                tabIndex="0"
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanWithPopOver,
                )}
            >
                {colSpan > 1 && 'R1'}
                <HelpOutlineIcon className={classes.helpIcon} />
            </span>
            {poperOpen && (
                <Paper elevation={1} className={classes.popover}>
                    <IconButton
                        onClick={() => setPoperOpen(false)}
                        className={classes.popoverClose}
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
                            <FormattedMessage {...MESSAGES.vacine} />:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {campaign.original.vacine}
                        </Grid>
                        <Grid item sm={12} container justifyContent="flex-end">
                            <Button
                                onClick={() => setDialogOpen(true)}
                                size="small"
                                color="primary"
                            >
                                <FormattedMessage {...MESSAGES.edit} />
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <CreateEditDialog
                selectedCampaign={campaign.original}
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </TableCell>
    );
};

R1Cell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    campaign: PropTypes.object.isRequired,
};

export { R1Cell };
