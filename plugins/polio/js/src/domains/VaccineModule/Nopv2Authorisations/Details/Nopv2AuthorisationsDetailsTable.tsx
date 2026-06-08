import React, { FunctionComponent } from 'react';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { baseUrls } from '../../../../constants/urls';
import { useGetAuthorisations } from '../hooks/api';
import { VaccineAuthDetailsParams } from '../types';
import { useNopv2AuthDetailsTableColumns } from './useNopv2AuthDetailsTableColumns';

type Props = { params: VaccineAuthDetailsParams };

export const Nopv2AuthorisationsDetailsTable: FunctionComponent<Props> = ({
    params,
}) => {
    const safeParams = useUrlParams(params);
    const { data: authorisations, isFetching } =
        useGetAuthorisations(safeParams);
    const columns = useNopv2AuthDetailsTableColumns();
    return (
        <TableWithDeepLink
            data={authorisations?.results ?? []}
            count={authorisations?.count}
            pages={authorisations?.pages}
            params={safeParams}
            columns={columns}
            baseUrl={baseUrls.nopv2AuthDetails}
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
            }}
        />
    );
};
