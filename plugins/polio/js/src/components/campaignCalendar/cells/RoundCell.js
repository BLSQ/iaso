import React, { useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';

import { isEqual } from 'lodash';
import { PolioCreateEditDialog as CreateEditDialog } from '../../CreateEditDialog';
import { RoundPopper } from '../popper/RoundPopper';
import { useStyles } from '../Styles';
import { RoundPopperContext } from '../contexts/RoundPopperContext.tsx';
import { useSelector } from 'react-redux';

const RoundCell = ({ colSpan, campaign, round }) => {
    const classes = useStyles();
    const [dialogOpen, setDialogOpen] = useState(false);

    const { anchorEl, setAnchorEl } = useContext(RoundPopperContext);
    const [self, setSelf] = useState(null);

    const handleClick = useCallback(
        event => {
            if (!self) {
                setSelf(event.currentTarget);
            }
            setAnchorEl(
                isEqual(event.currentTarget, anchorEl)
                    ? null
                    : event.currentTarget,
            );
        },
        [anchorEl, self, setAnchorEl],
    );

    const handleClose = () => {
        setAnchorEl(null);
    };

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const open = self && isEqual(self, anchorEl);
    const isLogged = useSelector(state => Boolean(state.users.current));
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
            </span>
            {open && (
                <RoundPopper
                    open={open}
                    round={round}
                    anchorEl={anchorEl}
                    campaign={campaign}
                    handleClose={handleClose}
                    setDialogOpen={setDialogOpen}
                />
            )}
            {isLogged && (
                <CreateEditDialog
                    selectedCampaign={campaign.original}
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                />
            )}
        </TableCell>
    );
};

RoundCell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    campaign: PropTypes.object.isRequired,
    round: PropTypes.object.isRequired,
};

export { RoundCell };
