import React from 'react';
import CalendarToday from '@mui/icons-material/CalendarToday';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import DataSourceIcon from '@mui/icons-material/ListAltTwoTone';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import SettingsIcon from '@mui/icons-material/Settings';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import { MenuItem } from '../../../../../hat/assets/js/apps/Iaso/domains/app/types';
import MESSAGES from './messages';
import {
    calendarPath,
    campaignsPath,
    countryConfigPath,
    reasonsForDelayConfigPath,
} from './routes';

export const menu: MenuItem[] = [
    {
        label: MESSAGES.polio,
        key: 'polio',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.campaigns,
                key: 'list',
                permissions: campaignsPath.permissions,
                extraPath: '/campaignCategory/all',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.calendar,
                key: 'calendar',
                extraPath: '/campaignCategory/all/periodType/semester',
                permissions: calendarPath.permissions,
                icon: props => <CalendarToday {...props} />,
            },
            {
                label: MESSAGES.configuration,
                key: 'config',
                icon: props => <SettingsIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.country,
                        key: 'country',
                        permissions: countryConfigPath.permissions,
                        icon: props => <PhotoSizeSelectActualIcon {...props} />,
                    },
                    {
                        label: MESSAGES.reasonsForDelay,
                        key: 'reasonsfordelay',
                        permissions: reasonsForDelayConfigPath.permissions,
                        icon: props => <WatchLaterIcon {...props} />,
                    },
                ],
            },
        ],
    },
];
