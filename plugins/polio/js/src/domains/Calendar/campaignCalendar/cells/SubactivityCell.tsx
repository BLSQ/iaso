import React, { FunctionComponent } from 'react';

import { Box, TableCell } from '@mui/material';
import classnames from 'classnames';

import { useStyles } from '../Styles';
import { PeriodType } from '../types';

type Props = {
    colSpan: number;
    periodType: PeriodType;
    roundNumber: number;
};

export const SubactivityCell: FunctionComponent<Props> = ({
    colSpan,
    periodType,
    roundNumber,
}) => {
    const classes = useStyles();

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];

    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
            colSpan={colSpan}
        >
            <Box
                className={classes.coloredBox}
                sx={{
                    background: 'rebeccapurple',
                }}
            />
            <span
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanWithPopOver,
                )}
                style={{
                    color: 'white',
                }}
            >
                {periodType !== 'year' && colSpan > 1 && `R${roundNumber}`}
                {periodType === 'year' && colSpan > 1 && roundNumber}
            </span>
        </TableCell>
    );
};
