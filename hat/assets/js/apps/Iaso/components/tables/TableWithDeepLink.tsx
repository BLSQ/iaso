import React, { FunctionComponent, useCallback } from 'react';
import { Table, TableComponentProps } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { handleTableDeepLink } from '../../utils/table';
import { redirectToReplace } from '../../routing/actions';

type TableWithDeepLinkProps = TableComponentProps & {
    baseUrl: string;
};

export const TableWithDeepLink: FunctionComponent<TableWithDeepLinkProps> = ({
    baseUrl,
    ...props
}) => {
    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Table {...props} onTableParamsChange={handleTableDeepLink(baseUrl)} />
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
    const dispatch = useDispatch();
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
            dispatch(redirectToReplace(baseUrl, newParams));
        }
        if (invalidateQueries) {
            queryClient.invalidateQueries(invalidateQueries);
        }
    }, [
        baseUrl,
        count,
        dispatch,
        invalidateQueries,
        pageKey,
        pageSizeKey,
        params,
        queryClient,
    ]);
};
