import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';
import { useStyles } from '../Styles';

const R2Cell = ({ colSpan }) => {
    const classes = useStyles();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    return (
        <TableCell
            className={classnames(
                defaultCellStyles,
                classes.round,
                classes.round2,
            )}
            colSpan={colSpan}
        >
            {colSpan > 1 && <span className={classes.tableCellSpan}>R2</span>}
        </TableCell>
    );
};

R2Cell.propTypes = {
    colSpan: PropTypes.number.isRequired,
};

export { R2Cell };
