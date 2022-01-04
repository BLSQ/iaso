import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@material-ui/core';

import { colSpanTitle, staticFields } from '../constants';
import { useStyles } from '../Styles';

const StaticFieldsCells = ({ campaign }) => {
    const classes = useStyles();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    return staticFields.map(field => (
        <TableCell
            key={field.key}
            colSpan={colSpanTitle}
            className={classnames(defaultCellStyles)}
        >
            <span
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanRow,
                )}
            >
                {!field.render && campaign[field.key]}
                {field.render && field.render(campaign)}
            </span>
        </TableCell>
    ));
};

StaticFieldsCells.propTypes = {
    campaign: PropTypes.object.isRequired,
};

export { StaticFieldsCells };
