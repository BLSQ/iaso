import React, { FunctionComponent } from 'react';

import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';

import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useSamplingResultsColumns } from '../config';
import {
    tableDefaults,
    useGetPlanningSamplingResults,
} from '../hooks/requests/useGetPlanningSamplingResults';
import MESSAGES from '../messages';

export const SamplingResults: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.planningDetails);
    const { formatMessage } = useSafeIntl();
    const { planningId } = params;

    const { data: samplingResults, isFetching: isFetchingSamplingResults } =
        useGetPlanningSamplingResults(planningId, params);

    const columns = useSamplingResultsColumns();

    return (
        <>
            <Typography color="primary" variant="h6">
                {formatMessage(MESSAGES.samplingResults)}
            </Typography>
            <TableWithDeepLink
                baseUrl={baseUrls.planningDetails}
                data={samplingResults?.results ?? []}
                params={params}
                defaultSorted={[{ id: 'created_at', desc: true }]}
                pages={samplingResults?.pages ?? tableDefaults.page}
                count={samplingResults?.count ?? 0}
                columns={columns}
                countOnTop={false}
                extraProps={{
                    loading: isFetchingSamplingResults,
                    defaultPageSize: tableDefaults.limit,
                }}
            />
        </>
    );
};
