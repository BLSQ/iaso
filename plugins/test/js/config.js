import React from 'react';
import HelpIcon from '@mui/icons-material/Help';
import TestApp from './';
import MESSAGES from './messages';

const routes =  [
    {
        baseUrl: 'test',
        component: () => <TestApp />,
        permission: 'iaso_forms',
        params: [],
    },
];

const menu = [
    {
        label: MESSAGES.menuItem,
        key: 'test',
        permission: 'iaso_forms',
        icon: props => <HelpIcon {...props} />,
    },
];

export default {
    routes,
    menu,
}