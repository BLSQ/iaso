import React, { FunctionComponent } from 'react';
import Table from '@mui/material/Table/Table';
import type { TableProps } from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableRow from '@mui/material/TableRow/TableRow';
import { textPlaceholder } from 'bluesquare-components';
import { SxStyles } from '../../types/general';

type SubTableProps = TableProps & {
    values: any[];
    renderValue: (value: any) => string;
};

const styles: SxStyles = {
    table: {
        borderCollapse: 'collapse',
        width: '100%',
        height: '100%',
    },
    tableCell: {
        textAlign: 'center',
        padding: '0px',
        height: '30px',
    },
};

export const SubTable: FunctionComponent<SubTableProps> = ({
    values,
    renderValue,
    ...tableProps
}) => {
    return (
        <Table sx={styles.table} {...tableProps}>
            <TableBody>
                {values.length === 0 ? (
                    <TableRow>
                        <TableCell
                            sx={{
                                ...styles.tableCell,
                                borderBottom: 'none',
                            }}
                        >
                            {textPlaceholder}
                        </TableCell>
                    </TableRow>
                ) : (
                    values.map((value, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <TableRow key={`${renderValue(value)}${index}`}>
                            <TableCell
                                sx={{
                                    ...styles.tableCell,
                                    borderBottom:
                                        index === values.length - 1
                                            ? 'none'
                                            : '1px solid rgba(224, 224, 224, 1)',
                                }}
                            >
                                {renderValue(value) ?? textPlaceholder}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};
