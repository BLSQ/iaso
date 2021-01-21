import React from 'react';
import CheckBoxOutlinedIcon from '@material-ui/icons/CheckBoxOutlined';
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined';
import MESSAGES from './messages';

const displayReadOnly = ro => {
    return ro === true ? (
        <CheckBoxOutlinedIcon />
    ) : (
        <CheckBoxOutlineBlankOutlinedIcon />
    );
};

const dataSourcesTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.dataSourceName),
        accessor: 'name',
        Cell: settings => {
            return <span>{settings.original.name}</span>;
        },
    },
    {
        Header: formatMessage(MESSAGES.dataSourceDescription),
        accessor: 'description',
        Cell: settings => <span>{settings.original.description}</span>,
    },
    {
        Header: formatMessage(MESSAGES.dataSourceReadOnly),
        accessor: 'read_only',
        Cell: settings => (
            <span>{displayReadOnly(settings.original.read_only)}</span>
        ),
    },
];
export default dataSourcesTableColumns;
