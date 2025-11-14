import React, { FunctionComponent, useCallback } from 'react';
import {
    Table,
    TableComponentProps,
    useRedirectToReplace,
} from 'bluesquare-components';
import { useQueryClient } from 'react-query';

type TableWithDeepLinkProps = TableComponentProps & {
    baseUrl: string;
};

export const TableWithDeepLink: FunctionComponent<TableWithDeepLinkProps> = ({
    baseUrl,
    ...props
}) => {
    const redirectToReplace = useRedirectToReplace();
    return (
        <Table
            {...props}
            onTableParamsChange={newParams =>
                redirectToReplace(baseUrl, newParams)
            }
        />
    );
};

type UseDeleteTableRowArgs = {
    params: Record<string, any>;
    pageKey?: string;
    pageSizeKey?: string;
    count: number;
    invalidateQueries?: string[];
    baseUrl: string;
};

export const useDeleteTableRow = ({
    params,
    pageKey = 'page',
    pageSizeKey = 'pageSize',
    count,
    invalidateQueries,
    baseUrl,
}: UseDeleteTableRowArgs): (() => void) => {
    const queryClient = useQueryClient();
    const redirectToReplace = useRedirectToReplace();
    return useCallback(() => {
        const page = parseInt(params[pageKey], 10);
        const pageSize = parseInt(params[pageSizeKey], 10);
        const newCount = count - 1;
        // If count falls into the range of the previous page, redirect to that page
        if (newCount <= (page - 1) * pageSize && page > 1) {
            const newParams = {
                ...params,
                [pageKey]: `${page - 1}`,
            };
            redirectToReplace(baseUrl, newParams);
        }
        if (invalidateQueries) {
            queryClient.invalidateQueries(invalidateQueries);
        }
    }, [
        baseUrl,
        count,
        invalidateQueries,
        pageKey,
        pageSizeKey,
        params,
        queryClient,
        redirectToReplace,
    ]);
};
