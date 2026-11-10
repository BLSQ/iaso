import React, { FunctionComponent } from 'react';
import type { Theme } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell/TableCell';
import TableRow from '@mui/material/TableRow/TableRow';
import { LoadingSpinner } from 'bluesquare-components';
import { SxStyles } from '../../types/general';
import { NumberCell } from '../Cells/NumberCell';

type RowProps = {
    label?: string;
    value?: string | number | React.ReactNode;
    isLoading?: boolean;
    className?: string;
    withoutPadding?: boolean;
};

const styles: SxStyles = {
    label: (theme: Theme) => ({
        fontWeight: 'bold',
        borderRight: `1px solid ${theme.palette.lightGray.border}`,
    }),
    cellNoPadding: {
        padding: 0,
    },
};

export const PaperTableRow: FunctionComponent<RowProps> = ({
    label,
    value,
    isLoading = false,
    className,
    withoutPadding = false,
}) => {
    return (
        <TableRow className={className}>
            <TableCell sx={styles.label}>{label}</TableCell>
            <TableCell sx={withoutPadding ? styles.cellNoPadding : {}}>
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
