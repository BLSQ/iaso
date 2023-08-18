import React, { FunctionComponent } from 'react';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { NOPV2_AUTH } from '../../../../constants/routes';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useLatestAuthorisations } from '../hooks/api';
import { useNopv2AuthTableColumns } from './useNopv2AuthTableColumns';

type Props = { params: any };

export const Nopv2AuthorisationsTable: FunctionComponent<Props> = ({
    params,
}) => {
    const safeParams = useUrlParams(params);
    const { data: latestAuth, isFetching } =
        useLatestAuthorisations(safeParams);
    console.log('data', latestAuth);
    const columns = useNopv2AuthTableColumns();
    return (
        <TableWithDeepLink
            data={latestAuth?.results ?? []}
            count={latestAuth?.count}
            pages={latestAuth?.pages}
            params={safeParams}
            columns={columns}
            baseUrl={NOPV2_AUTH}
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
            }}
        />
    );
};
