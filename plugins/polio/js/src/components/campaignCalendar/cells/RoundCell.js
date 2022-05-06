import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';
import { useStyles } from '../Styles';

const RoundCell = ({ colSpan, campaign, round }) => {
    const classes = useStyles();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
            style={{ backgroundColor: campaign.color }}
            colSpan={colSpan}
        >
            {colSpan > 1 && (
                <span className={classes.tableCellSpan}>R{round.number}</span>
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
