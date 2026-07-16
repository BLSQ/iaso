import React, { FunctionComponent } from 'react';
import { TableRow, TableCell } from '@mui/material';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    leftCell: {
        // @ts-ignore
        borderRight: theme => `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
    leftCellNoDivider: {
        fontWeight: 'bold',
    },
};

type RowProps = {
    field: { label: string; value: any };
    placeholder?: string;
    showDivider?: boolean;
};

export const WidgetPaperRow: FunctionComponent<RowProps> = ({
    field,
    placeholder = textPlaceholder,
    showDivider = true,
}) => {
    const { label, value } = field;
    return (
        <TableRow>
            <TableCell
                sx={showDivider ? styles.leftCell : styles.leftCellNoDivider}
            >
                {label}
            </TableCell>
            <TableCell>{value || placeholder}</TableCell>
        </TableRow>
    );
};
