import React, { FunctionComponent } from 'react';

import { Box, TableCell } from '@mui/material';
import classnames from 'classnames';

import { useStyles } from '../Styles';

type Props = {
    colSpan: number;
};

export const SubactivityCell: FunctionComponent<Props> = ({ colSpan }) => {
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
                {colSpan}
            </span>
        </TableCell>
    );
};
