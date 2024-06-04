import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useGetLatestAuthorisations } from '../hooks/api';
import { useNopv2AuthTableColumns } from './useNopv2AuthTableColumns';
import { VaccineAuthParams } from '../types';
import { baseUrls } from '../../../../constants/urls';

type Props = { params: VaccineAuthParams & Partial<UrlParams> };

export const Nopv2AuthorisationsTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data: latestAuth, isFetching } = useGetLatestAuthorisations(params);
    const columns = useNopv2AuthTableColumns();
    return (
        // @ts-ignore
        <TableWithDeepLink
            data={latestAuth?.results ?? []}
            count={latestAuth?.count}
            pages={latestAuth?.pages}
            params={params}
            columns={columns}
            baseUrl={baseUrls.nopv2Auth}
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
            }}
        />
    );
};
