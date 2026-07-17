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
    leftCellWidth?: string;
};

export const WidgetPaperRow: FunctionComponent<RowProps> = ({
    field,
    placeholder = textPlaceholder,
    showDivider = true,
    leftCellWidth = 'auto',
}) => {
    const { label, value } = field;
    const leftCellSx = showDivider ? styles.leftCell : styles.leftCellNoDivider;
    return (
        <TableRow>
            <TableCell
                sx={{
                    ...leftCellSx,
                    width: leftCellWidth,
                }}
            >
                {label}
            </TableCell>
            <TableCell>{value || placeholder}</TableCell>
        </TableRow>
    );
};
