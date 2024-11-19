import React, { FunctionComponent } from 'react';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { useOrgUnitsTableColumns } from '../../config';
import { tableDefaults } from '../../hooks/requests/useGetOrgUnitChildren';

type Props = {
    baseUrl: string;
    params: Record<string, string>;
    paramsPrefix: string;
    data: any;
    loading: boolean;
};

export const OrgUnitChildrenTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    data,
    loading,
}) => {
    const columns = useOrgUnitsTableColumns();
    return (
        <TableWithDeepLink
            baseUrl={baseUrl}
            params={params}
            paramsPrefix={paramsPrefix}
            data={data?.orgunits ?? []}
            count={data?.count ?? 0}
            pages={data?.pages ?? 0}
            columns={columns}
            extraProps={{
                defaultPageSize: data?.limit ?? tableDefaults.limit,
                loading,
                columns,
            }}
        />
    );
};
