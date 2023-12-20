import React, { FunctionComponent } from 'react';
import { Column, UrlParams } from 'bluesquare-components';
import { TableWithDeepLink } from './TableWithDeepLink';

type Props = {
    params: Partial<UrlParams>;
    paramsPrefix?: string;
    data: { results?: any[]; count?: number; pages?: number };
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
    data,
    isFetching,
    baseUrl,
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
        />
    );
};
