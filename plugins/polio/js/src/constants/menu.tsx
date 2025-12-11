import React from 'react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarToday from '@mui/icons-material/CalendarToday';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import ExtensionIcon from '@mui/icons-material/Extension';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import GroupWork from '@mui/icons-material/GroupWork';
import HomeIcon from '@mui/icons-material/Home';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import InventoryIcon from '@mui/icons-material/Inventory';
import DataSourceIcon from '@mui/icons-material/ListAltTwoTone';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import { MenuItem } from '../../../../../hat/assets/js/apps/Iaso/domains/app/types';
import MESSAGES from './messages';
import {
    budgetPath,
    calendarPath,
    campaignsPath,
    chronogramPath,
    countryConfigPath,
    groupedCampaignsPath,
    imGlobalPath,
    imIhhPath,
    imOhhPath,
    lqasAfroPath,
    lqasCountryPath,
    nopvAuthPath,
    notificationPath,
    reasonsForDelayConfigPath,
    stockManagementPath,
    supplychainPath,
    vaccineRepositoryPath,
    nationalLogisticsPlanPath,
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
                label: MESSAGES.groupedCampaigns,
                key: 'groupedcampaigns',
                permissions: groupedCampaignsPath.permissions,
                icon: props => <GroupWork {...props} />,
            },
            {
                label: MESSAGES.calendar,
                key: 'calendar',
                extraPath:
                    '/campaignType/polio/campaignCategory/all/periodType/quarter',
                permissions: calendarPath.permissions,
                icon: props => <CalendarToday {...props} />,
            },
            {
                label: MESSAGES.lqas,
                key: 'lqas',
                icon: props => <AssessmentIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.byCountry,
                        key: 'lqas',
                        permissions: lqasCountryPath.permissions,
                        icon: props => <PhotoSizeSelectActualIcon {...props} />,
                    },
                    {
                        label: MESSAGES.map,
                        key: 'lqas-map',
                        permissions: lqasAfroPath.permissions,
                        icon: props => <PublicIcon {...props} />,
                    },
                ],
            },
            {
                label: MESSAGES.im,
                key: 'im',
                icon: props => <DonutSmallIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.imGlobal,
                        key: 'global',
                        permissions: imGlobalPath.permissions,
                        icon: props => <HomeWorkIcon {...props} />,
                    },
                    {
                        label: MESSAGES.imIHH,
                        key: 'ihh',
                        permissions: imIhhPath.permissions,
                        icon: props => <HomeIcon {...props} />,
                    },
                    {
                        label: MESSAGES.imOHH,
                        key: 'ohh',
                        permissions: imOhhPath.permissions,
                        icon: props => <StorefrontIcon {...props} />,
                    },
                ],
            },
            {
                label: MESSAGES.budget,
                key: 'budget',
                permissions: budgetPath.permissions,
                icon: props => <AccountBalanceWalletIcon {...props} />,
            },
            {
                label: MESSAGES.vaccinemodule,
                key: 'vaccinemodule',
                icon: props => <ExtensionIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.nopv2Auth,
                        key: 'nopv2authorisation',
                        permissions: nopvAuthPath.permissions,
                        icon: props => <MenuBookIcon {...props} />,
                    },
                    {
                        label: MESSAGES.vaccineSupplyChain,
                        key: 'supplychain',
                        // using read permission to grant access
                        // because backend won't accept fetching with write permission only
                        permissions: supplychainPath.permissions,
                        icon: props => <LocalShippingIcon {...props} />,
                    },
                    {
                        label: MESSAGES.vaccineStockManagement,
                        key: 'stockmanagement',
                        permissions: stockManagementPath.permissions,
                        icon: props => <StorageIcon {...props} />,
                    },
                    {
                        label: MESSAGES.nationalLogisticsPlan,
                        key: 'nationalLogisticsPlan',
                        permissions: nationalLogisticsPlanPath.permissions,
                        icon: props => <BarChartIcon {...props} />,
                    },
                    {
                        label: MESSAGES.vaccineRepository,
                        key: 'repository',
                        permissions: vaccineRepositoryPath.permissions,
                        icon: props => <InventoryIcon {...props} />,
                    },
                    {
                        label: MESSAGES.chronogram,
                        key: 'chronogram',
                        permissions: chronogramPath.permissions,
                        icon: props => <PendingActionsIcon {...props} />,
                    },
                ],
            },
            {
                label: MESSAGES.notifications,
                key: 'notifications',
                permissions: notificationPath.permissions,
                icon: props => <NotificationsActiveIcon {...props} />,
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
