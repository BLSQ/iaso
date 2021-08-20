import React from 'react';
import PropTypes from 'prop-types';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

const Body = ({ page, getTableBodyProps, prepareRow, rowsPerPage }) => {
    return (
        <TableBody {...getTableBodyProps}>
            {page.slice(0, rowsPerPage).map(row => {
                prepareRow(row);
                const rowProps = row.getRowProps();
                return (
                    <TableRow {...rowProps} key={rowProps.key}>
                        {row.cells.map(cell => {
                            const cellProps = cell.getCellProps();
                            return (
                                <TableCell
                                    {...cellProps}
                                    key={cellProps.key}
                                    align={
                                        cell.column.id === 'actions'
                                            ? 'center'
                                            : 'left'
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
