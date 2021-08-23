import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
// import { FormattedMessage } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import MaUTable from '@material-ui/core/Table';
import Checkbox from '@material-ui/core/Checkbox';
import TablePagination from '@material-ui/core/TablePagination';
import Paper from '@material-ui/core/Paper';
import TableContainer from '@material-ui/core/TableContainer';

import {
    useSafeIntl,
    commonStyles,
    // SelectionSpeedDials,
} from 'bluesquare-components';
import {
    useTable,
    usePagination,
    useSortBy,
    useResizeColumns,
} from 'react-table';
import { MESSAGES } from '../messages';

import {
    selectionInitialState,
    getParamsKey,
    getSort,
    getOrderArray,
    // defaultSelectionActions,
} from '../tableUtils';
// import { formatThousand } from '../../../../utils';
import { Head } from './Head';
import { Body } from './Body';
import { onSelect, isItemSelected, Select, getSelectionCol } from './Select';
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

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-updated_at';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        '& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-head': {
            fontWeight: 'bold',
        },
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
    countOnTop,
    marginTop,
    // selection: { selectCount },
    multiSelect,
    selectionActions,
    setTableSelection,
    selection,
    selectionActionMessage,
}) => {
    const intl = useSafeIntl();
    const { formatMessage } = intl;
    const classes = useStyles();
    const urlPageSize = parseInt(
        params[getParamsKey(paramsPrefix, 'pageSize')],
        10,
    );

    if (multiSelect && !columns.find(c => c.accessor === 'selected')) {
        columns.push(
            getSelectionCol(selection, setTableSelection, count, formatMessage),
        );
    }

    const getPageIndex = () => {
        return params[getParamsKey(paramsPrefix, 'page')]
            ? params[getParamsKey(paramsPrefix, 'page')] - 1
            : DEFAULT_PAGE - 1;
    };
    const getPageSize = () => {
        return (
            urlPageSize ||
            (extraProps && extraProps.defaultPageSize) ||
            DEFAULT_PAGE_SIZE
        );
    };
    const getPageSort = () => {
        return params[getParamsKey(paramsPrefix, 'order')]
            ? getOrderArray(params[getParamsKey(paramsPrefix, 'order')])
            : getOrderArray(DEFAULT_ORDER);
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        gotoPage,
        setPageSize,
        page,
        state: { pageSize, pageIndex, sortBy },
    } = useTable(
        {
            columns,
            data,
            initialState: {
                pageIndex: getPageIndex(),
                pageSize: getPageSize(),
                sortBy: getPageSort(),
            },
            disableMultiSort: true,
            manualPagination: true,
            manualSortBy: true,
            pageCount: pages,
        },
        useSortBy,
        useResizeColumns,
        usePagination,
    );

    const onTableParamsChange = (key, value) => {
        const newParams = {
            ...params,
        };
        if (key === 'order' && value.length > 0) {
            newParams[getParamsKey(paramsPrefix, 'order')] = getSort(value);
        } else if (key !== 'order') {
            newParams[getParamsKey(paramsPrefix, key)] = value;
        }

        if (key === 'pageSize') {
            newParams[getParamsKey(paramsPrefix, 'page')] = 1;
            setPageSize(value);
        }
        if (key === 'page') {
            gotoPage(value - 1);
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

    // let actions = [
    //     ...defaultSelectionActions(
    //         () => setTableSelection('selectAll', [], count),
    //         () => setTableSelection('reset'),
    //         formatMessage,
    //     ),
    // ];
    // actions = actions.concat(selectionActions);

    return (
        <Box mt={marginTop ? 4 : 0} className={classes.root}>
            <Select
                count={count}
                multiSelect={multiSelect}
                selectionActions={selectionActions}
                selection={selection}
                setTableSelection={setTableSelection}
                selectionActionMessage={selectionActionMessage}
            />
            {/* {selectCount > 0 && (
                <span>
                    {`${formatThousand(selectCount)} `}
                    <FormattedMessage {...MESSAGES.selected} />
                    {' - '}
                </span>
            )}
            <SelectionSpeedDials
                selection={selection}
                hidden={!multiSelect}
                actions={actions}
                reset={() => setTableSelection('reset')}
                actionMessage={
                    selectionActionMessage ??
                    formatMessage(MESSAGES.selectionAction)
                }
            /> */}
            <Paper className={classes.paper}>
                <TableContainer>
                    <MaUTable {...tableProps}>
                        <Head headerGroups={headerGroups} />
                        <Body
                            page={page}
                            getTableBodyProps={getTableBodyProps}
                            prepareRow={prepareRow}
                            rowsPerPage={rowsPerPage}
                        />
                    </MaUTable>
                </TableContainer>
                {data && data.length > 0 && (
                    <TablePagination
                        labelRowsPerPage="Rows per page"
                        rowsPerPageOptions={[5, 10, 20, 30, 40, 50]}
                        component="div"
                        count={count}
                        rowsPerPage={rowsPerPage}
                        page={pageIndex}
                        onPageChange={(event, newPage) => {
                            onTableParamsChange('page', newPage + 1);
                        }}
                        onRowsPerPageChange={event => {
                            onTableParamsChange('pageSize', event.target.value);
                        }}
                        nextIconButtonText="next"
                        backIconButtonText="previous"
                        labelDisplayedRows={({ from, to }) =>
                            `Page: ${
                                pageIndex + 1
                            } --- ${from}-${to} of ${count} result(s), ${pages} page(s)`
                        }
                    />
                )}
            </Paper>
        </Box>
    );
};
Table.defaultProps = {
    count: 0,
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
