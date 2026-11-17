import React, { FC, ReactNode } from 'react';
import {
    SxProps,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
} from '@mui/material';
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
