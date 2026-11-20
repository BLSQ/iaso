import React, { FC, ReactNode } from 'react';

import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableContainer from '@mui/material/TableContainer/TableContainer';
import TableRow from '@mui/material/TableRow/TableRow';
import type { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { textPlaceholder } from 'bluesquare-components';
import { LEFT_CELL_WIDTH } from 'Iaso/domains/missions/constants';
import { SxStyles } from 'Iaso/types/general';
import { missionStyles } from '../styles';

const styles: SxStyles = {
    labelCell: {
        width: LEFT_CELL_WIDTH,
        backgroundColor: 'grey.50',
        color: 'text.secondary',
    },
};

type Props = {
    rows: { label: string; value: ReactNode }[];
};

export const DetailsTable: FC<Props> = ({ rows }) => (
    <TableContainer sx={missionStyles.bordered}>
        <Table sx={missionStyles.borderedTable as SxProps}>
            <TableBody>
                {rows.map(({ label, value }) => (
                    <TableRow key={label}>
                        <TableCell sx={styles.labelCell}>{label}</TableCell>
                        <TableCell>{value || textPlaceholder}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);
