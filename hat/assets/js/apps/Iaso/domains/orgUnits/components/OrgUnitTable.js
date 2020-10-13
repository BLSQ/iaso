import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';

import commonStyles from '../../../styles/common';

import Table from '../../../components/tables/TableComponent';
import Filters from '../../../components/tables/TableFilters';
import DownloadButtonsComponent from '../../../components/buttons/DownloadButtonsComponent';

import { orgUnitsTableColumns } from '../config';

import { fetchOrgUnitsList } from '../../../utils/requests';
import getTableUrl, {
    getParamsKey,
    getTableParams,
    tableInitialResult,
} from '../../../utils/tableUtils';

import {
    orgUnitFiltersWithPrefix,
    onlyChildrenParams,
} from '../../../constants/filters';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const endPointPath = 'orgunits';

const OrgUnitTable = ({
    intl: { formatMessage },
    currentOrgUnit,
    paramsPrefix,
    params,
    baseUrl,
    redirectTo,
    apiParams,
}) => {
    const [loading, setLoading] = useState(false);
    const [tableResults, setTableResults] = useState(tableInitialResult);

    const dispatch = useDispatch();
    const classes = useStyles();
    const groups = useSelector(state => state.orgUnits.groups);
    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);

    const newApiParams = {
        ...apiParams,
        ...onlyChildrenParams(paramsPrefix, params, currentOrgUnit),
    };

    const filters = orgUnitFiltersWithPrefix(
        paramsPrefix,
        Boolean(currentOrgUnit),
        formatMessage,
        groups,
        orgUnitTypes,
    );

    const tableParams = getTableParams(
        params,
        paramsPrefix,
        filters,
        newApiParams,
    );
    const columns = orgUnitsTableColumns(formatMessage, classes);

    const fetchOrgUnits = () => {
        const url = getTableUrl(endPointPath, tableParams);
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
        getTableUrl(endPointPath, tableParams, true, exportType);

    useEffect(() => {
        fetchOrgUnits();
    }, [
        params[getParamsKey(paramsPrefix, 'pageSize')],
        params[getParamsKey(paramsPrefix, 'pageSize')],
        params[getParamsKey(paramsPrefix, 'order')],
    ]);

    const { data, pages, count } = tableResults;
    const { limit } = tableParams;
    return (
        <Box className={classes.containerFullHeightPadded}>
            <Filters
                baseUrl={baseUrl}
                params={params}
                onSearch={() => fetchOrgUnits()}
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
    currentOrgUnit: null,
    paramsPrefix: '',
    baseUrl: '',
    apiParams: null,
};

OrgUnitTable.propTypes = {
    intl: PropTypes.object.isRequired,
    currentOrgUnit: PropTypes.object,
    params: PropTypes.object.isRequired,
    paramsPrefix: PropTypes.string,
    baseUrl: PropTypes.string,
    redirectTo: PropTypes.func.isRequired,
    apiParams: PropTypes.object,
};

export default withRouter(injectIntl(OrgUnitTable));
