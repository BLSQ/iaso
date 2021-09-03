import React from 'react';
import { Table } from 'bluesquare-components';
import { string } from 'prop-types';
import { handleTableDeepLink } from '../../utils/table';

export const TableWithDeepLink = ({ baseUrl, ...props }) => {
    const onTableParamsChange = handleTableDeepLink(baseUrl);
    const newProps = { ...props };
    newProps.onTableParamsChange = onTableParamsChange;
    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Table {...props} onTableParamsChange={handleTableDeepLink(baseUrl)} />
    );
};

TableWithDeepLink.propTypes = {
    baseUrl: string.isRequired,
};
