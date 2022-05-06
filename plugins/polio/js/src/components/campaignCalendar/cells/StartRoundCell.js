import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import { PolioCreateEditDialog as CreateEditDialog } from '../../CreateEditDialog';
import { RoundPopper } from '../popper/RoundPopper';
import { useStyles } from '../Styles';

const StartRoundCell = ({ colSpan, campaign, round }) => {
    const classes = useStyles();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const open = Boolean(anchorEl);
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
            style={{ backgroundColor: campaign.color }}
            colSpan={colSpan}
        >
            <span
                onClick={handleClick}
                role="button"
                tabIndex="0"
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanWithPopOver,
                )}
            >
                {colSpan > 1 && `R${round.number}`}
                <HelpOutlineIcon className={classes.helpIcon} />
            </span>
            {open && (
                <RoundPopper
                    open={open}
                    round={round}
                    anchorEl={anchorEl}
                    campaign={campaign}
                    handleClick={handleClick}
                    setDialogOpen={setDialogOpen}
                />
            )}

            <CreateEditDialog
                selectedCampaign={campaign.original}
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </TableCell>
    );
};

StartRoundCell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    campaign: PropTypes.object.isRequired,
    round: PropTypes.object.isRequired,
};

export { StartRoundCell };
