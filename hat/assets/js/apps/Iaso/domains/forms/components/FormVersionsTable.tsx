import React, { FunctionComponent } from 'react';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { useFormVersionsTableColumns } from '../config';
import { useGetFormVersions } from '../hooks/useGetFormVersions';

type Props = {
    baseUrl: string;
    formId: any;
    periodType: any;
    defaultPageSize?: number;
    params: Record<string, any>;
};

export const FormVersionsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    formId,
    periodType,
    defaultPageSize = 20,
}) => {
    const columns = useFormVersionsTableColumns(formId, periodType);
    const { data, isFetching: loading } = useGetFormVersions({
        formId,
        params,
    });

    return (
        <TableWithDeepLink
            baseUrl={baseUrl}
            params={params}
            data={data?.form_versions ?? []}
            count={data?.count ?? 0}
            pages={data?.pages ?? 0}
            columns={columns}
            defaultSorted={[{ id: 'version_id', desc: true }]}
            extraProps={{
                defaultPageSize: data?.limit ?? defaultPageSize,
                periodType,
                loading,
            }}
        />
    );
};
