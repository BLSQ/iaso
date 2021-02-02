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
}) => {
    const [loading, setLoading] = useState(false);
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
    );

    const handleFetch = () => {
        const url = getTableUrl(endPointPath, tableParams);
        setLoading(true);
        fetchItems(dispatch, url).then(res => {
            setLoading(false);
            setTableResults({
                data: res[dataKey !== '' ? dataKey : endPointPath],
                count: res.count,
                pages: res.pages,
            });
        });
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

    const { data, pages, count } = tableResults;
    const { limit } = tableParams;
    let extraProps = {
        loading,
        defaultPageSize: limit,
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
                    <DownloadButtonsComponent
                        csvUrl={getExportUrl('csv')}
                        xlsxUrl={getExportUrl('xlsx')}
                        gpkgUrl={getExportUrl('gpkg')}
                    />
                </Box>
            )}
            <Table
                count={count}
                data={data}
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
};

SingleTable.propTypes = {
    params: PropTypes.object.isRequired,
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
    onForceRefreshDone: PropTypes.func,
};

export default withRouter(SingleTable);
