import React from 'react';
import {
    AnonymousRoutePath,
    RoutePath,
} from '../../../../../hat/assets/js/apps/Iaso/constants/routes';
import { BudgetProcessList } from '../domains/Budget';
import { BudgetProcessDetails } from '../domains/Budget/BudgetDetails/BudgetDetails';
import { Calendar } from '../domains/Calendar/Calendar';
import { CampaignHistory } from '../domains/Campaigns/campaignHistory/CampaignHistory';
import { Dashboard } from '../domains/Campaigns/CampaignsList/Dashboard';
import { Chronogram } from '../domains/Chronogram/Chronogram';
import { ChronogramDetails } from '../domains/Chronogram/ChronogramDetails';
import { ChronogramTemplateTask } from '../domains/Chronogram/ChronogramTemplateTask';
import { CountryNotificationsConfig } from '../domains/Config/CountryNotification/CountryNotificationsConfig';
import { ReasonsForDelay } from '../domains/Config/ReasonsForDelay/ReasonsForDelay';
import { GroupedCampaigns } from '../domains/GroupedCampaigns/GroupedCampaigns';
import { ImStats } from '../domains/LQAS-IM/IM';
import { Lqas } from '../domains/LQAS-IM/LQAS';
import { LqasAfroOverview } from '../domains/LQAS-IM/LQAS/LqasAfroOverview/LqasAfroOverview';
import { Notifications } from '../domains/Notifications';
import { Nopv2AuthorisationsDetails } from '../domains/VaccineModule/Nopv2Authorisations/Details/Nopv2AuthorisationsDetails';
import { Nopv2Authorisations } from '../domains/VaccineModule/Nopv2Authorisations/Nopv2Authorisations';
import { VaccineRepository } from '../domains/VaccineModule/Repository/VaccineRepository';
import { VaccineStockManagementDetails } from '../domains/VaccineModule/StockManagement/Details/VaccineStockManagementDetails';
import { PublicVaccineStock } from '../domains/VaccineModule/StockManagement/PublicPage/PublicVaccineStock';
import { VaccineStockVariation } from '../domains/VaccineModule/StockManagement/StockVariation/VaccineStockVariation';
import { VaccineStockManagement } from '../domains/VaccineModule/StockManagement/VaccineStockManagement';
import { VaccineSupplyChainDetails } from '../domains/VaccineModule/SupplyChain/Details/VaccineSupplyChainDetails';
import { VaccineSupplyChain } from '../domains/VaccineModule/SupplyChain/VaccineSupplyChain';
import {
    BUDGET,
    BUDGET_ADMIN,
    CHRONOGRAM,
    CHRONOGRAM_RESTRICTED_WRITE,
    NOTIFICATION,
    POLIO,
    POLIO_ADMIN,
    STOCK_MANAGEMENT_READ,
    STOCK_MANAGEMENT_READ_ONLY,
    STOCK_MANAGEMENT_WRITE,
    SUPPLYCHAIN_READ,
    SUPPLYCHAIN_READ_ONLY,
    SUPPLYCHAIN_WRITE,
} from './permissions';
import {
    EMBEDDED_CALENDAR_URL,
    EMBEDDED_VACCINE_REPOSITORY_URL,
    EMBEDDED_VACCINE_STOCK_URL,
    baseUrls,
} from './urls';
import { LqasCountryBlock } from '../domains/LQAS-IM/LQAS/CountryBlockView/LqasCountryBlock';

// We store the path in a variable so we can import it and use its permissions
export const campaignsPath: RoutePath = {
    baseUrl: baseUrls.campaigns,
    routerUrl: `${baseUrls.campaigns}/*`,
    element: <Dashboard />,
    permissions: [POLIO, POLIO_ADMIN],
    isRootUrl: true,
};

export const campaignHistoryPath: RoutePath = {
    baseUrl: baseUrls.campaignHistory,
    routerUrl: `${baseUrls.campaignHistory}/*`,
    element: <CampaignHistory />,
    permissions: [POLIO, POLIO_ADMIN],
    isRootUrl: true,
};

export const groupedCampaignsPath: RoutePath = {
    baseUrl: baseUrls.groupedCampaigns,
    routerUrl: `${baseUrls.groupedCampaigns}/*`,
    element: <GroupedCampaigns />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const calendarPath: RoutePath = {
    baseUrl: baseUrls.calendar,
    routerUrl: `${baseUrls.calendar}/*`,
    element: <Calendar />,
    permissions: [POLIO, POLIO_ADMIN],
};
export const vaccineRepositoryPath: RoutePath = {
    baseUrl: baseUrls.vaccineRepository,
    routerUrl: `${baseUrls.vaccineRepository}/*`,
    element: <VaccineRepository />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const embeddedCalendarPath: AnonymousRoutePath = {
    allowAnonymous: true,
    baseUrl: EMBEDDED_CALENDAR_URL,
    routerUrl: `${EMBEDDED_CALENDAR_URL}/*`,
    element: <Calendar />,
    isRootUrl: false,
};
export const embeddedVaccineRepositoryPath: AnonymousRoutePath = {
    allowAnonymous: true,
    baseUrl: EMBEDDED_VACCINE_REPOSITORY_URL,
    routerUrl: `${EMBEDDED_VACCINE_REPOSITORY_URL}/*`,
    element: <VaccineRepository />,
    isRootUrl: false,
};
export const embeddedVaccineStockPath: AnonymousRoutePath = {
    allowAnonymous: true,
    baseUrl: EMBEDDED_VACCINE_STOCK_URL,
    routerUrl: `${EMBEDDED_VACCINE_STOCK_URL}/*`,
    element: <PublicVaccineStock />,
    isRootUrl: false,
};

export const lqasCountryPath: RoutePath = {
    baseUrl: baseUrls.lqasCountry,
    routerUrl: `${baseUrls.lqasCountry}/*`,
    element: <Lqas />,
    permissions: [POLIO, POLIO_ADMIN],
};
export const lqasCountryBlockPath: RoutePath = {
    baseUrl: baseUrls.lqasCountryBlock,
    routerUrl: `${baseUrls.lqasCountryBlock}/*`,
    element: <LqasCountryBlock />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const lqasAfroPath: RoutePath = {
    baseUrl: baseUrls.lqasAfro,
    routerUrl: `${baseUrls.lqasAfro}/*`,
    element: <LqasAfroOverview />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const imGlobalPath: RoutePath = {
    baseUrl: baseUrls.imGlobal,
    routerUrl: `${baseUrls.imGlobal}/*`,
    element: <ImStats />,
    permissions: [POLIO, POLIO_ADMIN],
};
export const imIhhPath: RoutePath = {
    baseUrl: baseUrls.imHH,
    routerUrl: `${baseUrls.imHH}/*`,
    element: <ImStats />,
    permissions: [POLIO, POLIO_ADMIN],
};
export const imOhhPath: RoutePath = {
    baseUrl: baseUrls.imOHH,
    routerUrl: `${baseUrls.imOHH}/*`,
    element: <ImStats />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const budgetPath: RoutePath = {
    baseUrl: baseUrls.budget,
    routerUrl: `${baseUrls.budget}/*`,
    element: <BudgetProcessList />,
    permissions: [BUDGET, BUDGET_ADMIN],
};

export const budgetDetailsPath: RoutePath = {
    baseUrl: baseUrls.budgetDetails,
    routerUrl: `${baseUrls.budgetDetails}/*`,
    element: <BudgetProcessDetails />,
    permissions: [BUDGET, BUDGET_ADMIN],
};

export const nopvAuthPath: RoutePath = {
    baseUrl: baseUrls.nopv2Auth,
    routerUrl: `${baseUrls.nopv2Auth}/*`,
    element: <Nopv2Authorisations />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const nopvAuthDetailsPath: RoutePath = {
    baseUrl: baseUrls.nopv2AuthDetails,
    routerUrl: `${baseUrls.nopv2AuthDetails}/*`,
    element: <Nopv2AuthorisationsDetails />,
    permissions: [POLIO, POLIO_ADMIN],
};

export const supplychainPath: RoutePath = {
    baseUrl: baseUrls.vaccineSupplyChain,
    routerUrl: `${baseUrls.vaccineSupplyChain}/*`,
    element: <VaccineSupplyChain />,
    permissions: [SUPPLYCHAIN_READ, SUPPLYCHAIN_WRITE, SUPPLYCHAIN_READ_ONLY],
};

export const supplychainDetailsPath: RoutePath = {
    baseUrl: baseUrls.vaccineSupplyChainDetails,
    routerUrl: `${baseUrls.vaccineSupplyChainDetails}/*`,
    element: <VaccineSupplyChainDetails />,
    permissions: [SUPPLYCHAIN_READ, SUPPLYCHAIN_WRITE, SUPPLYCHAIN_READ_ONLY],
};

export const stockManagementPath: RoutePath = {
    baseUrl: baseUrls.stockManagement,
    routerUrl: `${baseUrls.stockManagement}/*`,
    element: <VaccineStockManagement />,
    permissions: [
        STOCK_MANAGEMENT_READ,
        STOCK_MANAGEMENT_WRITE,
        STOCK_MANAGEMENT_READ_ONLY,
    ],
};

export const stockManagementDetailsPath: RoutePath = {
    baseUrl: baseUrls.stockManagementDetails,
    routerUrl: `${baseUrls.stockManagementDetails}/*`,
    element: <VaccineStockManagementDetails />,
    permissions: [
        STOCK_MANAGEMENT_READ,
        STOCK_MANAGEMENT_WRITE,
        STOCK_MANAGEMENT_READ_ONLY,
    ],
};

export const stockVariationPath: RoutePath = {
    baseUrl: baseUrls.stockVariation,
    routerUrl: `${baseUrls.stockVariation}/*`,
    element: <VaccineStockVariation />,
    permissions: [
        STOCK_MANAGEMENT_READ,
        STOCK_MANAGEMENT_WRITE,
        STOCK_MANAGEMENT_READ_ONLY,
    ],
};

export const notificationPath: RoutePath = {
    baseUrl: baseUrls.notification,
    routerUrl: `${baseUrls.notification}/*`,
    element: <Notifications />,
    permissions: [NOTIFICATION],
};

export const countryConfigPath: RoutePath = {
    baseUrl: baseUrls.countryConfig,
    routerUrl: `${baseUrls.countryConfig}/*`,
    element: <CountryNotificationsConfig />,
    permissions: [POLIO_ADMIN],
};

export const reasonsForDelayConfigPath: RoutePath = {
    baseUrl: baseUrls.reasonsForDelayConfig,
    routerUrl: `${baseUrls.reasonsForDelayConfig}/*`,
    element: <ReasonsForDelay />,
    permissions: [POLIO_ADMIN],
};

export const chronogramPath: RoutePath = {
    baseUrl: baseUrls.chronogram,
    routerUrl: `${baseUrls.chronogram}/*`,
    element: <Chronogram />,
    permissions: [CHRONOGRAM, CHRONOGRAM_RESTRICTED_WRITE],
};

export const chronogramTemplateTaskPath: RoutePath = {
    baseUrl: baseUrls.chronogramTemplateTask,
    routerUrl: `${baseUrls.chronogramTemplateTask}/*`,
    element: <ChronogramTemplateTask />,
    permissions: [CHRONOGRAM],
};

export const chronogramDetailsPath: RoutePath = {
    baseUrl: baseUrls.chronogramDetails,
    routerUrl: `${baseUrls.chronogramDetails}/*`,
    element: <ChronogramDetails />,
    permissions: [CHRONOGRAM, CHRONOGRAM_RESTRICTED_WRITE],
};

export const routes: (RoutePath | AnonymousRoutePath)[] = [
    campaignsPath,
    campaignHistoryPath,
    groupedCampaignsPath,
    calendarPath,
    embeddedCalendarPath,
    vaccineRepositoryPath,
    embeddedVaccineRepositoryPath,
    embeddedVaccineStockPath,
    lqasCountryPath,
    lqasCountryBlockPath,
    lqasAfroPath,
    imGlobalPath,
    imIhhPath,
    imOhhPath,
    budgetPath,
    budgetDetailsPath,
    nopvAuthPath,
    nopvAuthDetailsPath,
    supplychainPath,
    supplychainDetailsPath,
    stockManagementPath,
    stockManagementDetailsPath,
    stockVariationPath,
    notificationPath,
    countryConfigPath,
    reasonsForDelayConfigPath,
    chronogramPath,
    chronogramTemplateTaskPath,
    chronogramDetailsPath,
];
