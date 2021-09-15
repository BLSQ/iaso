import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import {
    getTableUrl,
    Table,
    getParamsKey,
    getTableParams,
    tableInitialResult,
    setTableSelection,
    selectionInitialState,
    commonStyles,
} from 'bluesquare-components';

import Filters from './TableFilters';

import DownloadButtonsComponent from '../DownloadButtonsComponent';
import { redirectToReplace } from '../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const SingleTable = ({
    filters,
    columns,
    paramsPrefix,
    params,
    baseUrl,
    apiParams,
    endPointPath,
    fetchItems,
    subComponent,
    defaultSorted,
    dataKey,
    exportButtons,
    forceRefresh,
    onForceRefreshDone,
    extraComponent,
    searchExtraComponent,
    hideGpkg,
    onDataLoaded,
    results,
    defaultPageSize,
    searchActive,
    toggleActiveSearch,
    isFullHeight,
    setIsLoading,
    multiSelect,
    selectionActions,
    propsToWatch,
}) => {
    const [loading, setLoading] = useState(false);
    const [selection, setSelection] = useState(selectionInitialState);
    const [didFetchData, setDidFetchData] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);
    const [tableResults, setTableResults] = useState(tableInitialResult);
    const { list, pages, count } = tableResults;
    const dispatch = useDispatch();
    const classes = useStyles();

    const tableParams = getTableParams(
        params,
        paramsPrefix,
        filters,
        apiParams,
        defaultSorted,
        defaultPageSize,
    );

    const handleFetch = () => {
        if (results?.list && firstLoad && !forceRefresh) {
            setTableResults(results);
        } else {
            const url = getTableUrl(endPointPath, tableParams);
            setIsLoading && setLoading(true);
            fetchItems &&
                fetchItems(dispatch, url).then(res => {
                    setIsLoading && setLoading(false);
                    const r = {
                        list: res[dataKey !== '' ? dataKey : endPointPath],
                        count: res.count,
                        pages: res.pages,
                    };
                    onDataLoaded(r);
                    setTableResults(r);
                    setDidFetchData(true);
                });
        }

        if (firstLoad) {
            setFirstLoad(false);
        }
    };

    const getExportUrl = exportType =>
        getTableUrl(endPointPath, tableParams, true, exportType);

    useEffect(() => {
        if (!firstLoad || (searchActive && firstLoad)) {
            handleFetch();
        } else if (!searchActive && firstLoad) {
            setFirstLoad(false);
        }
    }, [
        params[getParamsKey(paramsPrefix, 'pageSize')],
        params[getParamsKey(paramsPrefix, 'page')],
        params[getParamsKey(paramsPrefix, 'order')],
        params[getParamsKey(paramsPrefix, 'only_deleted')],
    ]);

    useEffect(() => {
        if (results && results.list) {
            setTableResults(results);
        }
    }, [results]);

    useEffect(() => {
        if (forceRefresh) {
            handleFetch();
            onForceRefreshDone();
        }
    }, [forceRefresh]);

    const { limit } = tableParams;
    const extraProps = {
        loading,
        defaultPageSize: defaultPageSize || limit,
        propsToWatch, // IA-763: pass an extra props that will be watched in table component to force the render
    };
    if (subComponent) {
        extraProps.SubComponent = original =>
            subComponent(original, handleFetch);
    }

    const handleTableSelection = (
        selectionType,
        items = [],
        totalCount = 0,
    ) => {
        setSelection(
            setTableSelection(selection, selectionType, items, totalCount),
        );
    };
    return (
        <Box
            className={
                isFullHeight ? classes.containerFullHeightNoTabPadded : ''
            }
        >
            {filters.length > 0 && (
                <Filters
                    baseUrl={baseUrl}
                    params={params}
                    onSearch={() => handleFetch()}
                    paramsPrefix={paramsPrefix}
                    filters={filters}
                    defaultFiltersUpdated={searchActive}
                    toggleActiveSearch={toggleActiveSearch}
                    extraComponent={searchExtraComponent}
                    redirectTo={(key, newParams) =>
                        dispatch(redirectToReplace(key, newParams))
                    }
                />
            )}
            {((count > 0 && exportButtons) || extraComponent) && (
                <Box mb={2} mt={2} display="flex" justifyContent="flex-end">
                    {extraComponent}

                    {count > 0 && exportButtons && (
                        <DownloadButtonsComponent
                            csvUrl={getExportUrl('csv')}
                            xlsxUrl={getExportUrl('xlsx')}
                            gpkgUrl={!hideGpkg ? getExportUrl('gpkg') : null}
                        />
                    )}
                </Box>
            )}
            {(didFetchData || searchActive) && (
                <Table
                    count={count}
                    data={list || []}
                    pages={pages}
                    multiSelect={multiSelect}
                    selectionActions={selectionActions}
                    selection={selection}
                    setTableSelection={(selectionType, items, totalCount) =>
                        handleTableSelection(selectionType, items, totalCount)
                    }
                    defaultSorted={defaultSorted}
                    columns={
                        Array.isArray(columns) ? columns : columns(handleFetch)
                    }
                    extraProps={extraProps}
                    baseUrl={baseUrl}
                    redirectTo={(key, newParams) =>
                        dispatch(redirectToReplace(key, newParams))
                    }
                    marginTop={Boolean(
                        filters.length > 0 ||
                            (count > 0 && exportButtons) ||
                            extraComponent,
                    )}
                    paramsPrefix={paramsPrefix}
                    params={params}
                />
            )}
        </Box>
    );
};

SingleTable.defaultProps = {
    paramsPrefix: '',
    baseUrl: '',
    apiParams: null,
    filters: [],
    defaultSorted: [{ id: 'name', desc: false }],
    subComponent: null,
    columns: [],
    dataKey: '',
    exportButtons: true,
    forceRefresh: false,
    onForceRefreshDone: () => null,
    params: {
        pageSize: 10,
        page: 1,
        order: '-created_at',
    },
    extraComponent: null,
    searchExtraComponent: <></>,
    hideGpkg: false,
    onDataLoaded: () => null,
    results: undefined,
    defaultPageSize: 10,
    searchActive: true,
    toggleActiveSearch: false,
    fetchItems: null,
    isFullHeight: true,
    setIsLoading: true,
    multiSelect: false,
    selectionActions: [],
    propsToWatch: null,
};

SingleTable.propTypes = {
    params: PropTypes.object,
    paramsPrefix: PropTypes.string,
    baseUrl: PropTypes.string,
    fetchItems: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    apiParams: PropTypes.object,
    subComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    endPointPath: PropTypes.string.isRequired,
    filters: PropTypes.array,
    columns: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    defaultSorted: PropTypes.array,
    dataKey: PropTypes.string,
    exportButtons: PropTypes.bool,
    hideGpkg: PropTypes.bool,
    forceRefresh: PropTypes.bool,
    onForceRefreshDone: PropTypes.func,
    extraComponent: PropTypes.node,
    searchExtraComponent: PropTypes.node,
    onDataLoaded: PropTypes.func,
    results: PropTypes.object,
    defaultPageSize: PropTypes.number,
    searchActive: PropTypes.bool,
    toggleActiveSearch: PropTypes.bool,
    isFullHeight: PropTypes.bool,
    setIsLoading: PropTypes.bool,
    multiSelect: PropTypes.bool,
    selectionActions: PropTypes.array,
    propsToWatch: PropTypes.any,
};

export default withRouter(SingleTable);
