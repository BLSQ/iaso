import React, { FunctionComponent } from 'react';
import { Column, UrlParams, Setting } from 'bluesquare-components';
import { TableWithDeepLink } from './TableWithDeepLink';

type Props = {
    params: Partial<UrlParams>;
    paramsPrefix?: string;
    data?: { results?: any[]; count?: number; pages?: number };
    isFetching: boolean;
    columns?: Column[];
    baseUrl: string;
    extraProps?: Record<string, any>;
    elevation?: number;
    marginTop?: boolean;
    columnSelectorButtonType?: 'button' | 'icon';
    columnSelectorButtonDisabled?: boolean;
    columnSelectorEnabled?: boolean;
    defaultSorted?: any;
    multiSelect?: boolean;
    // eslint-disable-next-line no-unused-vars
    rowProps?: (row: Setting<any>['row']) => Record<string, unknown>;
    // eslint-disable-next-line no-unused-vars
    cellProps?: (cell: any) => Record<string, unknown>;
};

/**
 * A simple wrap over TableWithDeepLink
 * It assumes the data comes with a "results" key and saves the boilerplaty null checks on
 * data, data.count and data.pages
 *
 */

export const SimpleTableWithDeepLink: FunctionComponent<Props> = ({
    params,
    paramsPrefix,
    data = { results: [], count: 0, pages: 0 },
    isFetching,
    baseUrl,
    rowProps,
    cellProps,
    extraProps = {},
    columns = [],
    elevation = 2,
    marginTop = true,
    defaultSorted,
    columnSelectorButtonType = 'button',
    columnSelectorEnabled = false,
    columnSelectorButtonDisabled = false,
    multiSelect = false,
}) => {
    return (
        <TableWithDeepLink
            data={data?.results ?? []}
            count={data?.count}
            pages={data?.pages}
            params={params}
            paramsPrefix={paramsPrefix}
            columns={columns}
            multiSelect={multiSelect}
            baseUrl={baseUrl}
            defaultSorted={defaultSorted}
            marginTop={marginTop}
            elevation={elevation}
            extraProps={{
                loading: isFetching,
                params,
                ...extraProps,
            }}
            columnSelectorEnabled={columnSelectorEnabled}
            columnSelectorButtonDisabled={columnSelectorButtonDisabled}
            columnSelectorButtonType={columnSelectorButtonType}
            // typing is wrong in Table
            // @ts-ignore
            rowProps={rowProps}
            // typing is wrong in Table
            // @ts-ignore
            cellProps={cellProps}
        />
    );
};
