import { Box, makeStyles } from '@material-ui/core';
import { useMemo } from 'react';
import { useTable } from 'react-table';

import commonStyles from '../styles/common';
import { TableHeader } from './Table/TableHeader';
import { TableCell } from './Table/TableCell';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    table: {
        borderSpacing: 0,
        border: '1px solid rgba(0,0,0,0.1)',
    },
    tableHeader: {
        display: 'flex',
        boxShadow: '0 2px 15px 0 rgb(0 0 0 / 15%)',
    },
    tableRow: {
        display: 'flex',
    },
}));

export const Dashboard = () => {
    const classes = useStyles();

    const data = useMemo(
        () => [
            {
                col1: 'Hello',
                col2: 'World',
            },
            {
                col1: 'react-table',
                col2: 'rocks',
            },
            {
                col1: 'whatever',
                col2: 'you want',
            },
        ],
        [],
    );

    const columns = useMemo(
        () => [
            {
                Header: 'Column 1',
                accessor: 'col1',
            },
            {
                Header: 'Column 2',
                accessor: 'col2',
            },
        ],
        [],
    );

    const tableInstance = useTable({ columns, data });

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    return (
        <Box className={classes.containerFullHeightNoTabPadded}>
            <table className={classes.table} {...getTableProps()}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr
                            className={classes.tableHeader}
                            {...headerGroup.getHeaderGroupProps()}
                        >
                            {headerGroup.headers.map(column => (
                                <TableHeader {...column.getHeaderProps()}>
                                    {column.render('Header')}
                                </TableHeader>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map(row => {
                        prepareRow(row);
                        return (
                            <tr
                                className={classes.tableRow}
                                {...row.getRowProps()}
                            >
                                {row.cells.map(cell => {
                                    return (
                                        <TableCell {...cell.getCellProps()}>
                                            {cell.render('Cell')}
                                        </TableCell>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Box>
    );
};
