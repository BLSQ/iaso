import React, { FunctionComponent, ReactNode } from 'react';

import { TableCell, TableRow } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(theme => ({
    cellLeft: {
        padding: theme.spacing(0, 1, 0, 0),
        border: 'none',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    cell: {
        border: 'none',
        padding: 0,
    },
}));

type Props = {
    label: string;
    value: ReactNode | string;
};

export const PopupRow: FunctionComponent<Props> = ({ label, value }) => {
    const classes: Record<string, string> = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.cellLeft}>{label}:</TableCell>
            <TableCell className={classes.cell}>{value}</TableCell>
        </TableRow>
    );
};
