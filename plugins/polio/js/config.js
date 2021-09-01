import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import SettingsIcon from '@material-ui/icons/Settings';
import { Dashboard } from './src/components/Dashboard';
import { CountryNotificationsConfig } from './src/components/CountryNotificationsConfig/CountryNotificationsConfig';
import MESSAGES from './src/constants/messages';

const routes = [
    {
        baseUrl: 'polio/list',
        component: () => <Dashboard />,
        permission: 'iaso_polio',
        params: [],
    },
    {
        baseUrl: 'polio/config',
        component: () => <CountryNotificationsConfig />,
        permission: 'iaso_forms',
        params: [
            {
                isRequired: false,
                key: 'order',
            },
            {
                isRequired: false,
                key: 'page',
            },
            {
                isRequired: false,
                key: 'pageSize',
            },
        ],
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
            {
                label: MESSAGES.configuration,
                key: 'config',
                permission: 'iaso_forms',
                icon: props => <SettingsIcon {...props} />,
            },
        ],
    },
];

export default {
    routes,
    menu,
};
