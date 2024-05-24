import React, { FunctionComponent, useMemo } from 'react';
import { Column } from 'bluesquare-components';
import { useFormsTableColumns } from '../config';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { useGetForms } from '../hooks/useGetForms';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
    orgUnitId?: string; // number as string
    defaultPageSize?: number;
    paramsPrefix?: string;
};

const decapitalize = (word: string) => {
    const split = word.split('');
    if (split.length === 0) {
        return word;
    }
    const [first, ...rest] = split;
    return [first.toLocaleLowerCase(), ...rest].join('');
};

export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    orgUnitId,
    defaultPageSize = 50,
    paramsPrefix,
}) => {
    const columns = useFormsTableColumns({
        showDeleted: params?.showDeleted === 'true',
        orgUnitId,
    }) as Column[];
    const apiParams = useMemo(() => {
        if (!paramsPrefix) {
            return params;
        }
        const newParams = { ...params };
        Object.keys(params)
            .filter(paramKey => paramKey.includes(paramsPrefix))
            .forEach(prefixedKey => {
                // eslint-disable-next-line no-unused-vars
                const [_, upperCaseKey] = prefixedKey.split(paramsPrefix);
                const formattedKey = decapitalize(upperCaseKey);
                newParams[formattedKey] = newParams[prefixedKey];
                delete newParams[prefixedKey];
            });
        return newParams;
    }, [params, paramsPrefix]);

    const { data: forms, isLoading: isLoadingForms } = useGetForms(apiParams);
    return (
        <TableWithDeepLink
            baseUrl={baseUrl}
            defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
            columns={columns}
            params={params}
            paramsPrefix={paramsPrefix}
            data={forms?.forms ?? []}
            count={forms?.count}
            pages={forms?.pages}
            extraProps={{
                loading: isLoadingForms,
                defaultPageSize: forms?.limit ?? defaultPageSize,
                ...apiParams, // need to force render when these change to avoid desync between params and url
            }}
        />
    );
};
