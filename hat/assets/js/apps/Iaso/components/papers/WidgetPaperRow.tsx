import React, { FunctionComponent } from 'react';
import { TableRow, TableCell } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { textPlaceholder } from 'Iaso/constants/uiConstants';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
}));

type RowProps = {
    field: { label: string; value: any };
    placeholder?: string
};

export const WidgetPaperRow = ({ field, placeholder=textPlaceholder }: RowProps) => {
    const { label, value } = field;
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
            <TableCell>{value || placeholder}</TableCell>
        </TableRow>
    );
};
