import React from 'react';
import { Table } from 'bluesquare-components';
import { handleTableDeepLink } from '../../utils/table';

// stub waiting for https://github.com/BLSQ/bluesquare-components/pull/111
interface TableProps {}

interface TableWithDeepLinkProps extends TableProps {
    baseUrl: string;
}

export const TableWithDeepLink: React.FC<TableWithDeepLinkProps> = ({
    baseUrl,
    ...props
}) => {
    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Table {...props} onTableParamsChange={handleTableDeepLink(baseUrl)} />
    );
};
