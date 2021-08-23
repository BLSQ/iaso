import React from 'react';
import PropTypes from 'prop-types';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    row: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.gray.background,
        },
        '&:nth-of-type(even)': {
            backgroundColor: 'transparent',
        },
    },
}));
const Body = ({ page, getTableBodyProps, prepareRow, rowsPerPage }) => {
    const classes = useStyles();
    const rows = page.slice(0, rowsPerPage);
    return (
        <TableBody {...getTableBodyProps}>
            {rows.map(row => {
                prepareRow(row);
                const rowProps = row.getRowProps();
                return (
                    <TableRow
                        {...rowProps}
                        key={rowProps.key}
                        className={classes.row}
                    >
                        {row.cells.map(cell => {
                            const cellProps = cell.getCellProps();
                            const align = cell.column.align || 'center';
                            return (
                                <TableCell
                                    {...cellProps}
                                    key={cellProps.key}
                                    align={
                                        cell.column.id === 'actions'
                                            ? 'center'
                                            : align
                                    }
                                >
                                    {cell.render('Cell')}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                );
            })}
        </TableBody>
    );
};

Body.defaultProps = {
    page: [],
    rowsPerPage: 10,
};

Body.propTypes = {
    page: PropTypes.array,
    getTableBodyProps: PropTypes.func.isRequired,
    prepareRow: PropTypes.func.isRequired,
    rowsPerPage: PropTypes.number,
};

export { Body };
