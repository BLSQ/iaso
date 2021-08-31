import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import SettingsIcon from '@material-ui/icons/Settings';
import { Dashboard } from './src/components/Dashboard';
import { EmailNotificationConfig } from './src/components/EmailNotifications/EmailNotificationsConfig';
import MESSAGES from './src/constants/messages';

const routes = [
    {
        baseUrl: 'polio/list',
        component: () => <Dashboard />,
        permission: 'iaso_forms',
        params: [],
    },
    {
        baseUrl: 'polio/config',
        component: () => <EmailNotificationConfig />,
        permission: 'iaso_forms',
        params: [
            {
                isRequired: false,
                key: 'order',
            },
            {
                isRequired: false,
                key: 'pageSize',
            },
            {
                isRequired: false,
                key: 'page',
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
                permission: 'iaso_forms',
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
