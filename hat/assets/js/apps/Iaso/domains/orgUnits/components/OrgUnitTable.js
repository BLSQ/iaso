import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import commonStyles from '../../../styles/common';

import Table from '../../../components/tables/TableComponent';
import Filters from '../../../components/tables/Filters';

import { orgUnitsTableColumns } from '../config';

import { fetchOrgUnitsList } from '../../../utils/requests';
import getTableUrl, { getSort, getOrderArray } from '../../../utils/tableUtils';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const getTableState = (params, paramsPrefix) => ({
    limit: params[`${paramsPrefix}PageSize`]
        ? parseInt(params[`${paramsPrefix}PageSize`], 10)
        : 10,
    page: params[`${paramsPrefix}Page`]
        ? parseInt(params[`${paramsPrefix}Page`], 10)
        : 0,
    order: params[`${paramsPrefix}Order`]
        ? getOrderArray(params[`${paramsPrefix}Order`])
        : [{ id: 'name', desc: false }],
});

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
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [tableResults, setTableResults] = useState(tableInitialResult);
    const dispatch = useDispatch();
    const columns = orgUnitsTableColumns(formatMessage, classes);

    const fetchOrgUnits = (urlParams = params) => {
        const tableState = getTableState(urlParams, paramsPrefix);
        const newParams = {
            ...apiParams,
            ...tableState,
            order: getSort(tableState.order),
            search: params[`${paramsPrefix}Search`],
        };
        const url = getTableUrl('orgunits', newParams);
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

    useEffect(() => {
        fetchOrgUnits();
    }, [
        params[`${paramsPrefix}PageSize`],
        params[`${paramsPrefix}Page`],
        params[`${paramsPrefix}Order`],
    ]);

    const { data, pages, count } = tableResults;
    return (
        <Box className={classes.containerFullHeightPadded}>
            <Filters
                baseUrl={baseUrl}
                params={params}
                onSearch={() => fetchOrgUnits(params)}
                paramsPrefix={paramsPrefix}
            />
            <Table
                count={count}
                data={data}
                pages={pages}
                defaultSorted={[{ id: 'name', desc: false }]}
                columns={columns}
                extraProps={{
                    loading,
                    pageSize: getTableState(params, paramsPrefix).limit,
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
