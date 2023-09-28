import React, { FunctionComponent } from 'react';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { NOPV2_AUTH_DETAILS } from '../../../../constants/routes';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useNopv2AuthDetailsTableColumns } from './useNopv2AuthDetailsTableColumns';
import { useGetAuthorisations } from '../hooks/api';
import { VaccineAuthDetailsParams } from '../types';

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
            baseUrl={NOPV2_AUTH_DETAILS}
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
            }}
        />
    );
};
