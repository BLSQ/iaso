import React, { FunctionComponent } from 'react';
// import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { NOPV2_AUTH } from '../../../../constants/routes';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useGetLatestAuthorisations } from '../hooks/api';
import { useNopv2AuthTableColumns } from './useNopv2AuthTableColumns';
import { VaccineAuthParams } from '../types';

type Props = { params: VaccineAuthParams };

export const Nopv2AuthorisationsTable: FunctionComponent<Props> = ({
    params,
}) => {
    // Waiting for backend API fix to uncomment
    const { data: latestAuth, isFetching } = useGetLatestAuthorisations(params);
    const columns = useNopv2AuthTableColumns();
    return (
        <TableWithDeepLink
            data={latestAuth?.results ?? []}
            count={latestAuth?.count}
            pages={latestAuth?.pages}
            params={params}
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
