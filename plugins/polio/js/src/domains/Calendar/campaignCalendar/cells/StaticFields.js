import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TableCell } from '@mui/material';

import { colSpanTitle } from '../constants';
import { useStyles } from '../Styles';
import { useStaticFields } from '../../hooks/useStaticFields';

const StaticFieldsCells = ({ campaign, isPdf }) => {
    const classes = useStyles();
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const fields = useStaticFields(isPdf);
    return fields.map(field => (
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
    isPdf: PropTypes.bool.isRequired,
};

export { StaticFieldsCells };
