import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';
import { useStyles } from '../Styles';

const EmptyCell = ({ colSpan, isCurrentWeek }) => {
    const classes = useStyles();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    return (
        <TableCell
            colSpan={colSpan}
            className={classnames(defaultCellStyles, {
                [classes.currentWeek]: isCurrentWeek,
            })}
        />
    );
};
EmptyCell.defaultProps = {
    isCurrentWeek: false,
};

EmptyCell.propTypes = {
    colSpan: PropTypes.number.isRequired,
    isCurrentWeek: PropTypes.bool,
};

export { EmptyCell };
