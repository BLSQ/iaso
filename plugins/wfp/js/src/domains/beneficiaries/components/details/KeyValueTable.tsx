import React, { FunctionComponent, ReactNode } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { keyValue } from './styles';

export const KeyValueTable: FunctionComponent<{
    rows: { key: string; value: ReactNode }[];
    emptyMessage?: string;
}> = ({ rows, emptyMessage }) => (
    <Table size="small" sx={keyValue.table}>
        <TableBody>
            {rows.map(({ key, value }) => (
                <TableRow key={key}>
                    <TableCell component="th" scope="row" sx={keyValue.cell}>
                        {key}
                    </TableCell>
                    <TableCell>{value}</TableCell>
                </TableRow>
            ))}
            {rows.length === 0 && emptyMessage && (
                <TableRow>
                    <TableCell colSpan={2} sx={keyValue.emptyCell}>
                        {emptyMessage}
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
);
