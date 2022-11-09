import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { redirectTo } from '../../routing/actions';
import { useGetCompletenessStats } from './hooks/api/useGetCompletnessStats';

const baseUrl = baseUrls.completenessStats;

export const CompletessStats: FunctionComponent = () => {
    const dispatch = useDispatch();
    const { data: completenessStats, isFetching } = useGetCompletenessStats();

    return (
        <TableWithDeepLink
            marginTop={false}
            data={completenessStats}
            pages={1}
            defaultSorted="created_at"
            columns={columns}
            // @ts-ignore
            count={completenessStats.length}
            baseUrl={baseUrl}
            params={{}}
            extraProps={{ loading: isFetching }}
            onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
        />
    );
};
