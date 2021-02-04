import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import commonStyles from '../../styles/common';

import Table from './TableComponent';
import Filters from './TableFilters';
import DownloadButtonsComponent from '../buttons/DownloadButtonsComponent';
import { redirectToReplace } from '../../routing/actions';

import getTableUrl, {
    getParamsKey,
    getTableParams,
    tableInitialResult,
} from '../../utils/tableUtils';

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
    hideGpkg,
    onDataLoaded,
    results,
    defaultPageSize,
}) => {
    const [loading, setLoading] = useState(false);
    const [firstLoad, setfFrstLoad] = useState(true);
    const [tableResults, setTableResults] = useState(tableInitialResult);
    const [expanded, setExpanded] = useState({});

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
        if (results && results.list && firstLoad) {
            setTableResults(results);
        } else {
            const url = getTableUrl(endPointPath, tableParams);
            setLoading(true);
            fetchItems(dispatch, url).then(res => {
                setLoading(false);
                const r = {
                    list: res[dataKey !== '' ? dataKey : endPointPath],
                    count: res.count,
                    pages: res.pages,
                };
                onDataLoaded(r);
                setTableResults(r);
            });
        }

        if (firstLoad) {
            setfFrstLoad(false);
        }
    };

    const getExportUrl = exportType =>
        getTableUrl(endPointPath, tableParams, true, exportType);

    useEffect(() => {
        handleFetch();
    }, [
        params[getParamsKey(paramsPrefix, 'pageSize')],
        params[getParamsKey(paramsPrefix, 'page')],
        params[getParamsKey(paramsPrefix, 'order')],
    ]);

    useEffect(() => {
        if (forceRefresh) {
            handleFetch();
            onForceRefreshDone();
        }
    }, [forceRefresh]);

    const { list, pages, count } = tableResults;
    const { limit } = tableParams;
    let extraProps = {
        loading,
        defaultPageSize: defaultPageSize || limit,
    };
    if (subComponent) {
        extraProps = {
            ...extraProps,
            SubComponent: ({ original }) => subComponent(original, handleFetch),
            expanded,
            onExpandedChange: newExpanded => setExpanded(newExpanded),
        };
    }
    return (
        <Box className={classes.containerFullHeightPadded}>
            {filters.length > 0 && (
                <Filters
                    baseUrl={baseUrl}
                    params={params}
                    onSearch={() => handleFetch()}
                    paramsPrefix={paramsPrefix}
                    filters={filters}
                />
            )}
            {count > 0 && exportButtons && (
                <Box mb={2} mt={2} display="flex" justifyContent="flex-end">
                    {extraComponent}
                    <DownloadButtonsComponent
                        csvUrl={getExportUrl('csv')}
                        xlsxUrl={getExportUrl('xlsx')}
                        gpkgUrl={!hideGpkg ? getExportUrl('gpkg') : null}
                    />
                </Box>
            )}
            <Table
                count={count}
                data={list || []}
                pages={pages}
                defaultSorted={defaultSorted}
                columns={
                    Array.isArray(columns) ? columns : columns(handleFetch)
                }
                extraProps={extraProps}
                baseUrl={baseUrl}
                redirectTo={(key, newParams) =>
                    dispatch(redirectToReplace(key, newParams))
                }
                paramsPrefix={paramsPrefix}
            />
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
    extraComponent: <></>,
    hideGpkg: false,
    onDataLoaded: () => null,
    results: undefined,
    defaultPageSize: 0,
};

SingleTable.propTypes = {
    params: PropTypes.object,
    paramsPrefix: PropTypes.string,
    baseUrl: PropTypes.string,
    fetchItems: PropTypes.func.isRequired,
    apiParams: PropTypes.object,
    subComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    endPointPath: PropTypes.string.isRequired,
    filters: PropTypes.array,
    columns: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    defaultSorted: PropTypes.array,
    dataKey: PropTypes.string,
    exportButtons: PropTypes.bool,
    forceRefresh: PropTypes.bool,
    hideGpkg: PropTypes.bool,
    onForceRefreshDone: PropTypes.func,
    extraComponent: PropTypes.node,
    onDataLoaded: PropTypes.func,
    results: PropTypes.object,
    defaultPageSize: PropTypes.number,
};

export default withRouter(SingleTable);
