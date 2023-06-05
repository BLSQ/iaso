import React, { FunctionComponent } from 'react';
import { Table, TableComponentProps } from 'bluesquare-components';
import { handleTableDeepLink } from '../../utils/table';

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
