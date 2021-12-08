import React from 'react';
import CheckIcon from '@material-ui/icons/Check';
import { Box } from '@material-ui/core';
import { LQAS_PASS, LQAS_FAIL, LQAS_DISQUALIFIED } from './constants';
import MESSAGES from '../../constants/messages';

const applyStatusColor = status => {
    if (status === LQAS_PASS) return { color: 'green' };
    if (status === LQAS_FAIL) return { color: 'red' };
    if (status === LQAS_DISQUALIFIED) return { color: 'orange' };
    return null;
};
export const lqasTableColumns = formatMessage => {
    return [
        {
            Header: formatMessage(MESSAGES.districtName),
            accessor: 'name',
            sortable: true,
        },
        {
            Header: formatMessage(MESSAGES.childrenMarked),
            accessor: 'total_child_fmd',
            sortable: false,
        },
        {
            Header: formatMessage(MESSAGES.childrenChecked),
            accessor: 'total_child_checked',
            sortable: false,
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            sortable: false,
            Cell: settings => (
                <span style={applyStatusColor(settings.row.original.status)}>
                    {formatMessage(MESSAGES[settings.row.original.status])}
                </span>
            ),
        },
        {
            Header: formatMessage(MESSAGES.districtFound),
            accessor: 'district',
            sortable: true,
            Cell: settings => {
                if (settings.row.original.district)
                    return (
                        <Box>
                            <CheckIcon />
                        </Box>
                    );
                return null;
            },
        },
    ];
};
