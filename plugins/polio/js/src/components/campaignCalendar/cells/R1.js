import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import { PolioCreateEditDialog as CreateEditDialog } from '../../CreateEditDialog';
import { R1Popper } from '../popper/R1';
import { useStyles } from '../Styles';

const R1Cell = ({ colSpan, campaign }) => {
    const classes = useStyles();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const open = Boolean(anchorEl);
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
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
                {colSpan > 1 && 'R1'}
                <HelpOutlineIcon className={classes.helpIcon} />
            </span>
            {open && (
                <R1Popper
                    open={open}
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

R1Cell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    campaign: PropTypes.object.isRequired,
};

export { R1Cell };
