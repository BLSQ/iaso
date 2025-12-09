import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';

import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import {
    tableDefaults,
    useGetPlanningSamplingResults,
} from '../hooks/requests/useGetPlanningSamplingResults';

export const SamplingResults: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.planningDetails);
    const { planningId } = params;

    const { data: samplingResults, isFetching: isFetchingSamplingResults } =
        useGetPlanningSamplingResults(planningId, params);

    const samplingResultsColumns = [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: 'Pipeline',
            accessor: 'pipeline_id',
        },
        {
            Header: 'Status',
            accessor: 'status',
            id: 'status',
        },
        {
            Header: 'GROUP',
            accessor: 'group_details',
            id: 'group_details',
            Cell: settings => settings.row.original.group_details.name,
        },
    ];

    return (
        <TableWithDeepLink
            baseUrl={baseUrls.planningDetails}
            data={samplingResults?.results ?? []}
            params={params}
            defaultSorted={[{ id: 'created_at', desc: true }]}
            pages={samplingResults?.pages ?? tableDefaults.page}
            count={samplingResults?.count ?? 0}
            columns={samplingResultsColumns}
            extraProps={{
                loading: isFetchingSamplingResults,
                defaultPageSize: tableDefaults.limit,
            }}
        />
    );
};
