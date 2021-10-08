import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import SettingsIcon from '@material-ui/icons/Settings';
import CalendarToday from '@material-ui/icons/CalendarToday';
import { Dashboard } from './src/pages/Dashboard';
import { Calendar } from './src/pages/Calendar';
import { CountryNotificationsConfig } from './src/components/CountryNotificationsConfig/CountryNotificationsConfig';
import MESSAGES from './src/constants/messages';
import {
    DASHBOARD_BASE_URL,
    CALENDAR_BASE_URL,
    CONFIG_BASE_URL,
} from './src/constants/routes';
import fr from './src/constants/translations/fr.json';
import en from './src/constants/translations/en.json';

const campaignsFilters = [
    {
        isRequired: false,
        key: 'countries',
    },
    {
        isRequired: false,
        key: 'obrName',
    },
    {
        isRequired: false,
        key: 'r1StartFrom',
    },
    {
        isRequired: false,
        key: 'r1StartTo',
    },
];

const routes = [
    {
        baseUrl: DASHBOARD_BASE_URL,
        component: props => <Dashboard {...props} />,
        permission: 'iaso_polio',
        params: [...campaignsFilters],
    },
    {
        baseUrl: CALENDAR_BASE_URL,
        component: props => <Calendar {...props} />,
        permission: 'iaso_polio',
        params: [
            {
                isRequired: false,
                key: 'currentDate',
            },
            {
                isRequired: false,
                key: 'order',
            },
            ...campaignsFilters,
        ],
    },
    {
        baseUrl: CONFIG_BASE_URL,
        component: () => <CountryNotificationsConfig />,
        permission: 'iaso_polio',
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
    {
        allowAnonymous: true,
        baseUrl: 'polio/embeddedCalendar',
        component: props => <Calendar {...props} embedded />,
        params: [
            {
                isRequired: false,
                key: 'currentDate',
            },
        ],
        isRootUrl: false,
    },
];

const menu = [
    {
        label: MESSAGES.polio,
        key: 'polio',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.campaigns,
                key: 'list',
                permission: 'iaso_polio',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.calendar,
                key: 'calendar',
                permission: 'iaso_polio',
                icon: props => <CalendarToday {...props} />,
            },
            {
                label: MESSAGES.configuration,
                key: 'config',
                permission: 'iaso_polio',
                icon: props => <SettingsIcon {...props} />,
            },
        ],
    },
];

const translations = {
    fr,
    en,
};

export default {
    routes,
    menu,
    translations,
};
