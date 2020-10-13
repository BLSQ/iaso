import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';

import commonStyles from '../../../styles/common';

import Table from '../../../components/tables/TableComponent';
import Filters from '../../../components/tables/Filters';
import DownloadButtonsComponent from '../../../components/buttons/DownloadButtonsComponent';

import { orgUnitsTableColumns } from '../config';

import { fetchOrgUnitsList } from '../../../utils/requests';
import getTableUrl, {
    getSort,
    getOrderArray,
    getParamsKey,
} from '../../../utils/tableUtils';

import { orgUnitFiltersWithPrefix } from '../../../constants/filters';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const getTableParams = (params, paramsPrefix, filters, apiParams) => {
    const newParams = {
        ...apiParams,
        limit:
            parseInt(params[getParamsKey(paramsPrefix, 'pageSize')], 10) || 10,
        page: parseInt(params[getParamsKey(paramsPrefix, 'page')], 10) || 0,
        order: getSort(
            params[getParamsKey(paramsPrefix, 'order')]
                ? getOrderArray(params[getParamsKey(paramsPrefix, 'order')])
                : [{ id: 'name', desc: false }],
        ),
    };
    filters.forEach(f => {
        newParams[f.apiUrlKey] = params[f.urlKey];
    });
    return newParams;
};

const endPointPath = 'orgunits';

const tableInitialResult = {
    data: [],
    pages: 0,
    count: 0,
};
const OrgUnitTable = ({
    intl: { formatMessage },
    apiParams,
    paramsPrefix,
    params,
    baseUrl,
    redirectTo,
}) => {
    const [loading, setLoading] = useState(false);
    const [tableResults, setTableResults] = useState(tableInitialResult);

    const dispatch = useDispatch();
    const classes = useStyles();
    const groups = useSelector(state => state.orgUnits.groups);
    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);

    const filters = orgUnitFiltersWithPrefix(
        paramsPrefix,
        formatMessage,
        groups,
        orgUnitTypes,
    );
    const columns = orgUnitsTableColumns(formatMessage, classes);

    const fetchOrgUnits = (urlParams = params) => {
        const url = getTableUrl(
            endPointPath,
            getTableParams(urlParams, paramsPrefix, filters, apiParams),
        );
        setLoading(true);
        fetchOrgUnitsList(dispatch, url).then(res => {
            setLoading(false);
            setTableResults({
                data: res.orgunits,
                count: res.count,
                pages: res.pages,
            });
        });
    };

    const getExportUrl = exportType =>
        getTableUrl(
            endPointPath,
            getTableParams(params, paramsPrefix, filters, apiParams),
            true,
            exportType,
        );

    useEffect(() => {
        fetchOrgUnits();
    }, [
        params[getParamsKey(paramsPrefix, 'pageSize')],
        params[getParamsKey(paramsPrefix, 'pageSize')],
        params[getParamsKey(paramsPrefix, 'order')],
    ]);

    const { data, pages, count } = tableResults;
    const tableParams = getTableParams(
        params,
        paramsPrefix,
        filters,
        apiParams,
    );
    const { limit } = tableParams;
    return (
        <Box className={classes.containerFullHeightPadded}>
            <Filters
                baseUrl={baseUrl}
                params={params}
                onSearch={() => fetchOrgUnits(params)}
                paramsPrefix={paramsPrefix}
                filters={filters}
            />
            {count > 0 && (
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
                defaultSorted={[{ id: 'name', desc: false }]}
                columns={columns}
                extraProps={{
                    loading,
                    defaultPageSize: limit,
                }}
                baseUrl={baseUrl}
                redirectTo={redirectTo}
                paramsPrefix={paramsPrefix}
            />
        </Box>
    );
};

OrgUnitTable.defaultProps = {
    apiParams: null,
    paramsPrefix: '',
    baseUrl: '',
};

OrgUnitTable.propTypes = {
    intl: PropTypes.object.isRequired,
    apiParams: PropTypes.object,
    params: PropTypes.object.isRequired,
    paramsPrefix: PropTypes.string,
    baseUrl: PropTypes.string,
    redirectTo: PropTypes.func.isRequired,
};

export default withRouter(injectIntl(OrgUnitTable));
