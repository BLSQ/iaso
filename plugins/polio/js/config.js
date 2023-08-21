/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import SettingsIcon from '@material-ui/icons/Settings';
import CalendarToday from '@material-ui/icons/CalendarToday';
import AssessmentIcon from '@material-ui/icons/Assessment';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import PublicIcon from '@material-ui/icons/Public';
import DonutSmallIcon from '@material-ui/icons/DonutSmall';
import GroupWork from '@material-ui/icons/GroupWork';
import HomeWorkIcon from '@material-ui/icons/HomeWork';
import PhotoSizeSelectActualIcon from '@material-ui/icons/PhotoSizeSelectActual';
import HomeIcon from '@material-ui/icons/Home';
import StorefrontIcon from '@material-ui/icons/Storefront';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import ExtensionIcon from '@material-ui/icons/Extension';
import { Dashboard } from './src/pages/Dashboard';
import { Calendar } from './src/pages/Calendar';
import { CampaignHistory } from './src/components/campaignHistory/CampaignHistory.tsx';
import { CountryNotificationsConfig } from './src/components/CountryNotificationsConfig/CountryNotificationsConfig';
import MESSAGES from './src/constants/messages';
import {
    DASHBOARD_BASE_URL,
    CAMPAIGN_HISTORY_URL,
    GROUPED_CAMPAIGNS,
    CALENDAR_BASE_URL,
    CONFIG_BASE_URL,
    LQAS_BASE_URL,
    IM_GLOBAL,
    IM_IHH,
    IM_OHH,
    BUDGET,
    BUDGET_DETAILS,
    LQAS_AFRO_MAP_URL,
    NOPV2_AUTH,
    NOPV2_AUTH_DETAILS,
} from './src/constants/routes';
import fr from './src/constants/translations/fr.json';
import en from './src/constants/translations/en.json';
import { Lqas } from './src/pages/LQAS';
import { ImStats } from './src/pages/IM';
import { paginationPathParams } from '../../../hat/assets/js/apps/Iaso/routing/common.ts';
import { GroupedCampaigns } from './src/pages/GroupedCampaigns/GroupedCampaigns.tsx';
import { BudgetDetails } from './src/pages/Budget/BudgetDetails/BudgetDetails.tsx';
import { BudgetList } from './src/pages/Budget/index.tsx';
import { LqasAfroOverview } from './src/pages/LQAS/LqasAfroOverview/LqasAfroOverview.tsx';
import { Nopv2Authorisations } from './src/pages/VaccineModule/Nopv2Authorisations/Nopv2Authorisations.tsx';
import { Nopv2AuthorisationsDetails } from './src/pages/VaccineModule/Nopv2Authorisations/Details/Nopv2AuthorisationsDetails.tsx';

const campaignsFilters = [
    {
        isRequired: false,
        key: 'countries',
    },
    {
        isRequired: false,
        key: 'search',
    },
    {
        isRequired: false,
        key: 'roundStartFrom',
    },
    {
        isRequired: false,
        key: 'roundStartTo',
    },
    {
        isRequired: false,
        key: 'showOnlyDeleted',
    },
    {
        isRequired: false,
        key: 'campaignType',
    },
    {
        isRequired: false,
        key: 'campaignGroups',
    },
    {
        isRequired: false,
        key: 'show_test',
    },
];

const routes = [
    {
        baseUrl: DASHBOARD_BASE_URL,
        component: props => <Dashboard {...props} />,
        permissions: ['iaso_polio'],
        isRootUrl: true,
        params: [
            ...paginationPathParams,
            {
                isRequired: false,
                key: 'campaignId',
            },
            ...campaignsFilters,
            {
                isRequired: false,
                key: 'fieldset',
            },
            {
                isRequired: false,
                key: 'orgUnitGroups',
            },
        ],
    },

    {
        baseUrl: CAMPAIGN_HISTORY_URL,
        component: props => <CampaignHistory {...props} />,
        permissions: ['iaso_polio'],
        isRootUrl: true,
        params: [
            {
                isRequired: true,
                key: 'campaignId',
            },
            {
                isRequired: false,
                key: 'logId',
            },
        ],
    },
    {
        baseUrl: GROUPED_CAMPAIGNS,
        component: props => <GroupedCampaigns {...props} />,
        permissions: ['iaso_polio'],
        params: [
            ...paginationPathParams,
            {
                isRequired: false,
                key: 'campaignId',
            },
            ...campaignsFilters,
        ],
    },
    {
        baseUrl: CALENDAR_BASE_URL,
        component: props => <Calendar {...props} />,
        permissions: ['iaso_polio'],
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
            {
                isRequired: false,
                key: 'orgUnitGroups',
            },
        ],
    },
    {
        baseUrl: `${LQAS_BASE_URL}/lqas`,
        component: props => <Lqas {...props} />,
        permissions: ['iaso_polio'],
        params: [
            {
                isRequired: false,
                key: 'campaign',
            },
            {
                isRequired: false,
                key: 'country',
            },
            {
                isRequired: false,
                key: 'rounds',
            },
        ],
    },
    {
        baseUrl: `${LQAS_AFRO_MAP_URL}`,
        component: props => <LqasAfroOverview {...props} />,
        permissions: ['iaso_polio'],
        params: [
            {
                isRequired: false,
                key: 'rounds',
            },
            {
                isRequired: false,
                key: 'startDate',
            },
            {
                isRequired: false,
                key: 'endDate',
            },
            {
                isRequired: false,
                key: 'period',
            },
        ],
    },
    {
        baseUrl: IM_OHH,
        component: props => <ImStats {...props} imType="imOHH" />,
        permissions: ['iaso_polio'],
        params: [
            {
                isRequired: false,
                key: 'imType',
            },
            {
                isRequired: false,
                key: 'campaign',
            },
            {
                isRequired: false,
                key: 'country',
            },
            {
                isRequired: false,
                key: 'rounds',
            },
        ],
    },
    {
        baseUrl: IM_IHH,
        component: props => <ImStats {...props} imType="imIHH" />,
        permissions: ['iaso_polio'],
        params: [
            {
                isRequired: false,
                key: 'campaign',
            },
            {
                isRequired: false,
                key: 'country',
            },
            {
                isRequired: false,
                key: 'rounds',
            },
        ],
    },
    {
        baseUrl: IM_GLOBAL,
        component: props => <ImStats {...props} imType="imGlobal" />,
        permissions: ['iaso_polio'],
        params: [
            {
                isRequired: false,
                key: 'campaign',
            },
            {
                isRequired: false,
                key: 'country',
            },
            {
                isRequired: false,
                key: 'rounds',
            },
        ],
    },
    {
        baseUrl: BUDGET,
        component: props => <BudgetList {...props} />,
        permissions: ['iaso_polio_budget'],
        params: [
            ...paginationPathParams,
            {
                isRequired: false,
                key: 'search',
            },
            {
                isRequired: false,
                key: 'budget_current_state_key__in',
            },
            {
                isRequired: false,
                key: 'roundStartFrom',
            },
            {
                isRequired: false,
                key: 'roundStartTo',
            },
            {
                isRequired: false,
                key: 'country__id__in',
            },
            {
                isRequired: false,
                key: 'orgUnitGroups',
            },
        ],
    },
    {
        baseUrl: BUDGET_DETAILS,
        component: props => <BudgetDetails {...props} />,
        permissions: ['iaso_polio_budget'],
        params: [
            ...paginationPathParams,

            {
                isRequired: false,
                key: 'campaignName',
            },
            {
                isRequired: false,
                key: 'campaignId',
            },
            {
                isRequired: false,
                key: 'country',
            },
            {
                isRequired: false,
                key: 'show_hidden',
            },
            {
                isRequired: false,
                key: 'action',
            },
            {
                isRequired: false,
                key: 'quickTransition',
            },
            {
                isRequired: false,
                key: 'previousStep',
            },
            {
                isRequired: false,
                key: 'transition_key',
            },
        ],
    },
    {
        baseUrl: NOPV2_AUTH,
        component: props => <Nopv2Authorisations {...props} />,
        permissions: ['iaso_polio'],
        params: [
            ...paginationPathParams,
            {
                isRequired: false,
                key: 'auth_status',
            },
            {
                isRequired: false,
                key: 'block_country',
            },
        ],
    },
    {
        baseUrl: NOPV2_AUTH_DETAILS,
        component: props => <Nopv2AuthorisationsDetails {...props} />,
        permissions: ['iaso_polio'],
        params: [
            ...paginationPathParams,
            {
                isRequired: false,
                key: 'countryId',
            },
            {
                isRequired: false,
                key: 'countryName',
            },
        ],
    },
    {
        baseUrl: CONFIG_BASE_URL,
        component: () => <CountryNotificationsConfig />,
        permissions: ['iaso_polio_config'],
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
            {
                isRequired: false,
                key: 'order',
            },
            ...campaignsFilters,
            {
                isRequired: false,
                key: 'orgUnitGroups',
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
                permissions: ['iaso_polio'],
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.groupedCampaigns,
                key: 'groupedcampaigns',
                permissions: ['iaso_polio'],
                icon: props => <GroupWork {...props} />,
            },
            {
                label: MESSAGES.calendar,
                key: 'calendar',
                permissions: ['iaso_polio'],
                icon: props => <CalendarToday {...props} />,
            },
            {
                label: MESSAGES.lqas,
                key: 'lqas',
                permissions: ['iaso_polio'],
                icon: props => <AssessmentIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.byCountry,
                        key: 'lqas',
                        permissions: ['iaso_polio'],
                        icon: props => <PhotoSizeSelectActualIcon {...props} />,
                    },
                    {
                        label: MESSAGES.map,
                        key: 'lqas-map',
                        permissions: ['iaso_polio'],
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
                        permissions: ['iaso_polio'],
                        icon: props => <HomeWorkIcon {...props} />,
                    },
                    {
                        label: MESSAGES.imIHH,
                        key: 'ihh',
                        permissions: ['iaso_polio'],
                        icon: props => <HomeIcon {...props} />,
                    },
                    {
                        label: MESSAGES.imOHH,
                        key: 'ohh',
                        permissions: ['iaso_polio'],
                        icon: props => <StorefrontIcon {...props} />,
                    },
                ],
            },
            {
                label: MESSAGES.budget,
                key: 'budget',
                permissions: ['iaso_polio_budget'],
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
                        permissions: ['iaso_polio'],
                        icon: props => <MenuBookIcon {...props} />,
                    },
                ],
            },
            {
                label: MESSAGES.configuration,
                key: 'config',
                permissions: ['iaso_polio_config'],
                icon: props => <SettingsIcon {...props} />,
            },
        ],
    },
];

const translations = {
    fr,
    en,
};

const overrideLanding = DASHBOARD_BASE_URL;

export default {
    routes,
    menu,
    translations,
    overrideLanding,
};
