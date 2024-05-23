import React, { FunctionComponent } from 'react';
import { Column } from 'bluesquare-components';
import { useFormsTableColumns } from '../config';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { useGetForms } from '../hooks/useGetForms';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
    orgUnitId?: string; // number as string
};

export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    orgUnitId,
}) => {
    const columns = useFormsTableColumns({
        showDeleted: params?.showDeleted === 'true',
        orgUnitId,
    }) as Column[];
    const { data: forms, isLoading: isLoadingForms } = useGetForms(params);
    return (
        <TableWithDeepLink
            baseUrl={baseUrl}
            defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
            columns={columns}
            params={params}
            data={forms?.forms ?? []}
            count={forms?.count}
            pages={forms?.pages}
            extraProps={{
                loading: isLoadingForms,
                defaultPageSize: forms?.limit ?? 50,
            }}
        />
    );
};
