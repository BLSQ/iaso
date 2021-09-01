import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import { Dashboard } from './src/components/Dashboard';
import MESSAGES from './src/constants/messages';

const routes = [
    {
        baseUrl: 'polio/list',
        component: () => <Dashboard />,
        permission: 'iaso_polio',
        params: [],
    },
];

const menu = [
    {
        label: MESSAGES.polio,
        key: 'polio',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.dashboard,
                key: 'list',
                permission: 'iaso_polio',
                icon: props => <FormatListBulleted {...props} />,
            },
        ],
    },
];

export default {
    routes,
    menu,
};
