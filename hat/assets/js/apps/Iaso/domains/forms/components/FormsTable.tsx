import React, { FunctionComponent } from 'react';
import { Column } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { useFormsTableColumns } from '../config';
import { tableDefaults, useGetForms } from '../hooks/useGetForms';
import MESSAGES from '../messages';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
    paramsPrefix?: string;
    tableDefaults?: { order?: string; limit?: number; page?: number };
    isSearchActive: boolean;
};

export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    tableDefaults: tableDefaultsProp,
    isSearchActive,
}) => {
    const columns = useFormsTableColumns({
        showDeleted: params?.showDeleted === 'true',
        orgUnitId: params?.orgUnitId,
        showInstancesCount: params?.showInstancesCount === 'true',
    }) as Column[];

    const apiParams = usePrefixedParams(paramsPrefix, params);

    const { data: forms, isFetching: isLoadingForms } = useGetForms(
        apiParams,
        tableDefaultsProp
            ? { ...tableDefaults, ...tableDefaultsProp }
            : tableDefaults,
        isSearchActive,
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
            pages={forms?.pages ?? 0}
            extraProps={{
                loading: isLoadingForms,
                defaultPageSize: forms?.limit ?? defaultLimit,
                ...apiParams, // need to force render when these change to avoid desync between params and url
            }}
            noDataMessage={
                !isSearchActive ? MESSAGES.searchToSeeForms : undefined
            }
        />
    );
};
