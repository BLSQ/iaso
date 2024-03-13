import React, { FunctionComponent } from 'react';
import classnames from 'classnames';

import { TableCell } from '@mui/material';
import { useStyles } from '../Styles';

type Props = {
    colSpan: number;
    isCurrentWeek?: boolean;
};

const EmptyCell: FunctionComponent<Props> = ({
    colSpan,
    isCurrentWeek = false,
}) => {
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

export { EmptyCell };
