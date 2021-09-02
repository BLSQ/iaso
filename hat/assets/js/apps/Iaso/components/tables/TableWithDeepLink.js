import React from 'react';
import { Table } from 'bluesquare-components';
import { string } from 'prop-types';
import { handleTableDeepLink } from '../../utils/table';

export const TableWithDeepLink = ({ baseUrl, ...props }) => {
    const onTableParamsChange = handleTableDeepLink(baseUrl);
    const newProps = { ...props };
    newProps.onTableParamsChange = onTableParamsChange;
    return <Table {...newProps} />;
};

TableWithDeepLink.propTypes = {
    baseUrl: string.isRequired,
};
