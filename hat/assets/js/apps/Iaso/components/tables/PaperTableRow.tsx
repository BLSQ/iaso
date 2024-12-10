import { TableCell, TableRow } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { SxStyles } from '../../types/general';
import { NumberCell } from '../Cells/NumberCell';

type RowProps = {
    label?: string;
    value?: string | number | React.ReactNode;
    isLoading?: boolean;
    withLeftCellBorder?: boolean;
    boldLeftCellText?: boolean;
    className?: string;
};

const styles: SxStyles = {
    withBorder: (theme: any) => ({
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
    }),
    boldTitle: {
        fontWeight: 'bold',
    },
};

export const PaperTableRow: FunctionComponent<RowProps> = ({
    label,
    value,
    isLoading = false,
    withLeftCellBorder = true,
    boldLeftCellText = true,
    className,
}) => {
    const cellStyles = {
        ...(withLeftCellBorder ? styles.withBorder : {}),
        ...(boldLeftCellText ? styles.boldTitle : {}),
    };
    return (
        <TableRow className={className}>
            <TableCell sx={cellStyles}>{label}</TableCell>
            <TableCell>
                {isLoading && (
                    <LoadingSpinner
                        fixed={false}
                        transparent
                        padding={4}
                        size={25}
                    />
                )}
                {!isLoading && typeof value !== 'number' && value}
                {!isLoading && typeof value === 'number' && (
                    <NumberCell value={value as number | undefined} />
                )}
            </TableCell>
        </TableRow>
    );
};
