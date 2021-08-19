import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import './index.css';
import MaUTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';
import Paper from '@material-ui/core/Paper';
import TableContainer from '@material-ui/core/TableContainer';
import TableSortLabel from '@material-ui/core/TableSortLabel';

import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { useTable, usePagination, useSortBy } from 'react-table';

import {
    selectionInitialState,
    getParamsKey,
    getSort,
    getOrderArray,
} from './tableUtils';
/**
 * Table component, no redux, no fetch, just displaying.
 * Multi selection is optionnal, if set to true you can add custom actions
 * Required props in order to work:
 * @param {Object} params
 * @param {Array} data
 * @param {Array} columns
 * @param {Number} pages
 * @param {Function} redirectTo
 *
 * Optionnal props:
 * @param {Number} count
 * @param {String} baseUrl
 * @param {Array} defaultSorted
 * @param {Array} marginTop
 * @param {Array} countOnTop
 * @param {Object} extraProps
 * @param {String} paramPrefix
 *
 * Multi selection is optionnal
 * Selection props:
 * @param {Boolean} multiSelect
 * if set to true you can add custom actions, an array of object(s):
 *   @param {Array} selectionActions
 *       @param {Array} icon
 *       @param {String} label
 *       @param {Function} onClick
 *       @param {Boolean} disabled
 * You need aslo to maintain selection state in parent component
 * You can use selectionInitialState and setTableSelection from Iaso/utils/tableUtils.js
 *   @param {Object} selection
 *   @param {Function} setTableSelection
 */

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    count: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: theme.spacing(2),
    },
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4),
        minHeight: 100,
        position: 'relative',
    },
    reactTableNoMarginTop: {
        marginTop: 0,
    },
    reactTableNoPaginationCountBottom: {
        marginBottom: theme.spacing(8),
    },
    countBottom: {
        position: 'absolute',
        bottom: -4,
        right: theme.spacing(4),
    },
    countBottomNoPagination: {
        bottom: 'auto',
        right: theme.spacing(2),
        top: 'calc(100% + 19px)',
    },
}));
const Table = ({
    params,
    data,
    count,
    extraProps,
    paramsPrefix,
    columns,
    redirectTo,
    baseUrl,
    pages,
    defaultSorted,
    countOnTop,
    marginTop,
    selection: { selectCount },
    multiSelect,
    selectionActions,
    setTableSelection,
    selection,
    selectionActionMessage,
}) => {
    const intl = useSafeIntl();
    const { formatMessage } = intl;
    const classes = useStyles();
    const defaultPageSize = '10';
    const urlPageSize = parseInt(
        params[getParamsKey(paramsPrefix, 'pageSize')],
        10,
    );

    const getPageIndex = () => {
        return params[getParamsKey(paramsPrefix, 'page')]
            ? params[getParamsKey(paramsPrefix, 'page')] - 1
            : 0;
    };
    const getPageSize = () => {
        return (
            urlPageSize ||
            (extraProps && extraProps.defaultPageSize) ||
            defaultPageSize
        );
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        // rows,
        prepareRow,
        page,
        state: { pageSize, pageIndex, sortBy },
    } = useTable(
        {
            columns,
            data,
            initialState: {
                pageIndex: getPageIndex(),
                pageSize: getPageSize(),
                sortBy: defaultSorted,
            },
            disableMultiSort: true,
            manualPagination: true,
            manualSortBy: true,
        },
        useSortBy,
        usePagination,
    );

    const onTableParamsChange = (key, value) => {
        const newParams = {
            ...params,
            [getParamsKey(paramsPrefix, key)]:
                key !== 'order' ? value : getSort(value),
        };
        if (key === 'pageSize') {
            newParams[getParamsKey(paramsPrefix, 'page')] = 1;
        }
        redirectTo(baseUrl, newParams);
    };

    useEffect(() => {
        onTableParamsChange('order', sortBy);
    }, [sortBy]);

    const tableProps = {
        ...getTableProps(),
        size: 'small',
    };
    const rowsPerPage = parseInt(pageSize, 10);
    // const rowsPerPage = 5;

    // console.log('pageSize', pageSize);
    // console.log('pageIndex', pageIndex);
    // console.log('page', page);
    // console.log('data', data);
    return (
        <Paper className={classes.paper}>
            <TableContainer>
                <MaUTable {...tableProps}>
                    <TableHead>
                        {headerGroups.map(headerGroup => {
                            const headerGroupProps =
                                headerGroup.getHeaderGroupProps();
                            return (
                                <TableRow
                                    {...headerGroupProps}
                                    key={headerGroupProps.key}
                                >
                                    {headerGroup.headers.map(column => {
                                        let direction;
                                        if (column.isSorted) {
                                            if (column.isSortedDesc) {
                                                direction = 'desc';
                                            }
                                            if (column.isSortedAsc) {
                                                direction = 'asc';
                                            }
                                        }
                                        const columnsProps =
                                            column.getHeaderProps(
                                                column.getSortByToggleProps(),
                                            );
                                        return (
                                            <TableCell
                                                {...columnsProps}
                                                key={columnsProps.key}
                                                align={
                                                    column.id === 'actions'
                                                        ? 'center'
                                                        : 'left'
                                                }
                                            >
                                                {column.canSort && (
                                                    <TableSortLabel
                                                        active={column.isSorted}
                                                        direction={direction}
                                                    >
                                                        {column.render(
                                                            'Header',
                                                        )}
                                                    </TableSortLabel>
                                                )}
                                                {!column.canSort &&
                                                    column.render('Header')}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableHead>
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
                </MaUTable>
            </TableContainer>
            <TablePagination
                labelRowsPerPage="Rows per page"
                rowsPerPageOptions={[5, 10, 20, 30, 40, 50]}
                component="div"
                count={count}
                rowsPerPage={rowsPerPage}
                page={pageIndex}
                onPageChange={(event, newPage) => {
                    onTableParamsChange('page', newPage + 1);
                    // onPageChange(newPage);
                }}
                onRowsPerPageChange={event => {
                    // handleChangeRowsPerPage
                    onTableParamsChange('pageSize', event.target.value);
                }}
                nextIconButtonText="next"
                backIconButtonText="previous"
                labelDisplayedRows={({ from, to }) =>
                    `${from}-${to} of ${count} result(s), ${pages} page(s)`
                }
            />
        </Paper>
    );
};
Table.defaultProps = {
    count: 0,
    defaultSorted: [{ id: 'updated_at', desc: true }],
    baseUrl: '',
    countOnTop: true,
    marginTop: true,
    multiSelect: false,
    selectionActions: [],
    selection: selectionInitialState,
    setTableSelection: () => null,
    extraProps: null,
    paramsPrefix: '',
    params: {
        pageSize: 10,
        page: 1,
        order: '-created_at',
    },
    watchToRender: null,
    selectionActionMessage: null,
};

Table.propTypes = {
    // used to come from router
    params: PropTypes.object,
    count: PropTypes.number,
    pages: PropTypes.number.isRequired,
    defaultSorted: PropTypes.array,
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    baseUrl: PropTypes.string,
    countOnTop: PropTypes.bool,
    marginTop: PropTypes.bool,
    multiSelect: PropTypes.bool,
    selectionActions: PropTypes.array,
    redirectTo: PropTypes.func.isRequired,
    setTableSelection: PropTypes.func,
    selection: PropTypes.object,
    extraProps: PropTypes.object,
    paramsPrefix: PropTypes.string,
    watchToRender: PropTypes.any,
    selectionActionMessage: PropTypes.string,
};

export { Table };
