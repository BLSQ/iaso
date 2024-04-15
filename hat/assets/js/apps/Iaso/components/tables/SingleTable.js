import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';
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
    useSkipEffectOnMount,
} from 'bluesquare-components';

import Filters from './TableFilters';

import DownloadButtonsComponent from '../DownloadButtonsComponent.tsx';
import { redirectToReplace } from '../../routing/actions.ts';
import { convertObjectToString } from '../../utils/dataManipulation.ts';
import { useAbortController } from '../../libs/apiHooks.ts';

export const useSingleTableParams = params => {
    return useMemo(() => {
        const { accountId, ...paramsToUse } = params;
        return paramsToUse;
    }, [params]);
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const SingleTable = ({
    filters,
    filtersColumnsCount,
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
    resetPageToOne,
}) => {
    const [loading, setLoading] = useState(false);
    const [selection, setSelection] = useState(selectionInitialState);
    const [didFetchData, setDidFetchData] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);
    const [tableResults, setTableResults] = useState(tableInitialResult);
    // We need to use state to be able to reset pagination when using built-in filters
    const [resetPagination, setResetPagination] = useState(resetPageToOne);
    const { list, pages, count } = tableResults;
    const dispatch = useDispatch();
    const classes = useStyles();
    // Can't use pattern matching or the reference to the AbortController object will be lost and the abort() function will error
    const abortController = useAbortController();

    const tableParams = getTableParams(
        params,
        paramsPrefix,
        filters,
        apiParams,
        defaultSorted,
        defaultPageSize,
    );

    const handleFetch = useCallback(
        // newParams is to allow passing the "tempParams" from the filter search handler,
        // which reset the page to 1 in the API call, which prevents making a call that results in a 404
        // It does result in a double API call however.
        newParams => {
            if (results?.list && firstLoad && !forceRefresh) {
                setTableResults(results);
            } else {
                const url = newParams
                    ? getTableUrl(
                          endPointPath,
                          getTableParams(
                              newParams,
                              paramsPrefix,
                              filters,
                              apiParams,
                              defaultSorted,
                              defaultPageSize,
                          ),
                      )
                    : getTableUrl(endPointPath, tableParams);
                setIsLoading && setLoading(true);
                fetchItems &&
                    fetchItems(
                        dispatch,
                        url,
                        newParams,
                        abortController.signal,
                    ).then(res => {
                        // cancelled fetch may return null. We tehn return to avoid memory leak IA-1186
                        if (!res) return;
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
        },
        [
            results,
            firstLoad,
            forceRefresh,
            endPointPath,
            paramsPrefix,
            filters,
            apiParams,
            defaultSorted,
            defaultPageSize,
            tableParams,
            setIsLoading,
            fetchItems,
            dispatch,
            dataKey,
            onDataLoaded,
            abortController.signal,
        ],
    );

    const getExportUrl = exportType =>
        getTableUrl(endPointPath, tableParams, true, exportType);

    const pageSizeParam = params[getParamsKey(paramsPrefix, 'pageSize')];
    const pageParam = params[getParamsKey(paramsPrefix, 'page')];
    const orderParam = params[getParamsKey(paramsPrefix, 'order')];
    const onlyDeletedParam = params[getParamsKey(paramsPrefix, 'only_deleted')];

    // TODO prevent double API calls when appplying Filters' onSearch
    // FIXME remove infinite loop when deps array is filled
    useEffect(() => {
        if (!firstLoad || (searchActive && firstLoad)) {
            if (abortController.signal) {
                handleFetch();
            }
        } else if (!searchActive && firstLoad) {
            setFirstLoad(false);
        }
    }, [
        pageSizeParam,
        pageParam,
        orderParam,
        onlyDeletedParam,
        abortController.signal,
    ]);

    const handleTableSelection = (
        selectionType,
        items = [],
        totalCount = 0,
    ) => {
        setSelection(
            setTableSelection(selection, selectionType, items, totalCount),
        );
    };
    useEffect(() => {
        if (results && results.list) {
            setTableResults(results);
        }
    }, [results]);

    useEffect(() => {
        if (forceRefresh && abortController.signal) {
            handleFetch();
            onForceRefreshDone();
        }
    }, [forceRefresh, handleFetch, onForceRefreshDone, abortController.signal]);

    useSkipEffectOnMount(() => {
        if (propsToWatch && abortController.signal) {
            handleFetch();
        }
    }, [propsToWatch, abortController.signal]);

    // Override state if prop changes
    // Should only have an impact if built-in filters are used with filters in parent
    useEffect(() => {
        setResetPagination(resetPageToOne);
    }, [resetPageToOne]);

    // Cancel fetch on unmount
    useEffect(() => {
        return () => {
            if (abortController.abort) {
                abortController.abort();
            }
        };
    }, [abortController, abortController.abort]);

    const { limit } = tableParams;
    const extraProps = {
        loading,
        defaultPageSize: defaultPageSize || limit,
    };
    if (subComponent && abortController.signal) {
        extraProps.SubComponent = original =>
            subComponent(original, handleFetch);
    }
    return (
        <Box
            className={
                isFullHeight ? classes.containerFullHeightNoTabPadded : ''
            }
        >
            {filters.length > 0 && abortController.signal && (
                <Filters
                    baseUrl={baseUrl}
                    params={params}
                    onSearch={newParams => handleFetch(newParams)}
                    paramsPrefix={paramsPrefix}
                    filters={filters}
                    defaultFiltersUpdated={searchActive}
                    toggleActiveSearch={toggleActiveSearch}
                    extraComponent={searchExtraComponent}
                    redirectTo={(key, newParams) => {
                        setResetPagination(convertObjectToString(newParams));
                        dispatch(redirectToReplace(key, newParams));
                    }}
                    filtersColumnsCount={filtersColumnsCount}
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
            {(didFetchData || searchActive) && abortController.signal && (
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
                    resetPageToOne={resetPagination}
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
    resetPageToOne: '',
    filtersColumnsCount: 3,
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
    resetPageToOne: PropTypes.string,
    filtersColumnsCount: PropTypes.number,
};

export default SingleTable;
