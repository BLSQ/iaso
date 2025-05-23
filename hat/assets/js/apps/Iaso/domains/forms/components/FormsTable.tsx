import React, { FunctionComponent } from 'react';
import { Column } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { useFormsTableColumns } from '../config';
import { tableDefaults, useGetForms } from '../hooks/useGetForms';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
    paramsPrefix?: string;
    tableDefaults?: {
        order?: string;
        limit?: number;
        page?: number;
    };
};

export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    tableDefaults: tableDefaultsProp,
}) => {
    const columns = useFormsTableColumns({
        showDeleted: params?.showDeleted === 'true',
        orgUnitId: params?.orgUnitId,
    }) as Column[];

    const apiParams = usePrefixedParams(paramsPrefix, params);

    const { data: forms, isFetching: isLoadingForms } = useGetForms(
        apiParams,
        tableDefaultsProp
            ? { ...tableDefaults, ...tableDefaultsProp }
            : tableDefaults,
    );
    const defaultLimit = tableDefaultsProp?.limit ?? tableDefaults.limit;
    return (
        <TableWithDeepLink
            baseUrl={baseUrl}
            defaultSorted={[{ id: 'name', desc: false }]}
            columns={columns}
            params={params}
            paramsPrefix={paramsPrefix}
            data={forms?.forms ?? []}
            count={forms?.count}
            pages={forms?.pages}
            extraProps={{
                loading: isLoadingForms,
                defaultPageSize: forms?.limit ?? defaultLimit,
                ...apiParams, // need to force render when these change to avoid desync between params and url
            }}
        />
    );
};
