/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactNode, useContext, useMemo } from 'react';

import DataSourceIcon from '@mui/icons-material/ListAltTwoTone';
import Link from '@mui/icons-material/Link';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import Input from '@mui/icons-material/Input';
import CompareArrows from '@mui/icons-material/CompareArrows';
import SupervisorAccount from '@mui/icons-material/SupervisorAccount';
import GroupsIcon from '@mui/icons-material/Groups';
import PhonelinkSetupIcon from '@mui/icons-material/PhonelinkSetup';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import DoneAll from '@mui/icons-material/DoneAll';
import Settings from '@mui/icons-material/Settings';
import GroupWork from '@mui/icons-material/GroupWork';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ImportantDevicesRoundedIcon from '@mui/icons-material/ImportantDevicesRounded';
import BookIcon from '@mui/icons-material/Book';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StorageIcon from '@mui/icons-material/Storage';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PaymentsIcon from '@mui/icons-material/Payments';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import { IntlFormatMessage, useSafeIntl } from 'bluesquare-components';
import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import BeneficiarySvg from '../components/svg/Beneficiary';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import * as paths from './routes';
import {
    hasFeatureFlag,
    SHOW_PAGES,
    SHOW_DHIS2_LINK,
    SHOW_BENEFICIARY_TYPES_IN_LIST_MENU,
    SHOW_DEV_FEATURES,
} from '../utils/featureFlags';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';

import MESSAGES from './messages';
import { useCurrentUser } from '../utils/usersUtils';
import {
    listMenuPermission,
    userHasOneOfPermissions,
} from '../domains/users/utils';
import { PluginsContext } from '../utils';
import { useGetBeneficiaryTypesDropdown } from '../domains/entities/hooks/requests';
import { DropdownOptions } from '../types/utils';
import { MenuItem, MenuItems, Plugins } from '../domains/app/types';
import { useGetOrgunitsExtraPath } from '../domains/home/hooks/useGetOrgunitsExtraPath';
import { CHANGE_REQUEST } from './urls';



// !! remove permission property if the menu has a subMenu !!
const menuItems = (
    entityTypes: Array<DropdownOptions<number>>,
    formatMessage: IntlFormatMessage,
    currentUser,
    orgUnitExtraPath?: string,
): MenuItems => {
    const beneficiariesListEntry: MenuItem = {
        label: formatMessage(MESSAGES.beneficiariesList),
        permissions: paths.entitiesPath.permissions,
        key: 'list',
        icon: props => <FormatListBulleted {...props} />,
    };
    if (hasFeatureFlag(currentUser, SHOW_BENEFICIARY_TYPES_IN_LIST_MENU)) {
        beneficiariesListEntry.subMenu = entityTypes.map(entityType => ({
            label: `${entityType.label}`,
            permissions: paths.entitiesPath.permissions,
            mapKey: `${entityType.value}`,
            isActive: pathname =>
                pathname?.includes(`/entityTypeIds/${entityType.value}/`) &&
                pathname?.includes(`entities/list/`),
            extraPath: `/entityTypeIds/${entityType.value}/order/-last_saved_instance/pageSize/20/page/1`,
        }));
    }
    return [
        {
            label: formatMessage(MESSAGES.formsTitle),
            key: 'forms',
            icon: props => <DataSourceIcon {...props} />,
            subMenu: [
                {
                    label: formatMessage(MESSAGES.formList),
                    permissions: paths.formsPath.permissions,
                    key: 'list',
                    icon: props => <FormatListBulleted {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.submissionsTitle),
                    extraPath: `/tab/list/mapResults/${locationLimitMax}`,
                    permissions: paths.instancesPath.permissions,
                    key: 'submissions',
                    icon: props => <Input {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.formsStats),
                    permissions: paths.formsStatsPath.permissions,
                    key: 'stats',
                    icon: props => <AssessmentIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.dhis2Mappings),
                    permissions: paths.mappingsPath.permissions,
                    key: 'mappings',
                    icon: props => <DHIS2Svg {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.completeness),
                    permissions: paths.completenessPath.permissions,
                    key: 'completeness',
                    icon: props => <DoneAll {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.completenessStats),
                    permissions: paths.completenessStatsPath.permissions,
                    key: 'completenessStats',
                    icon: props => <DoneAll {...props} />,
                },
            ],
        },
        {
            label: formatMessage(MESSAGES.orgUnitsTitle),
            key: 'orgunits',
            icon: props => <OrgUnitSvg {...props} />,
            subMenu: [
                {
                    label: formatMessage(MESSAGES.orgUnitList),
                    permissions: paths.orgUnitsPath.permissions,
                    extraPath: orgUnitExtraPath,
                    key: 'list',
                    icon: props => <FormatListBulleted {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.reviewChangeProposals),
                    permissions: paths.orgUnitChangeRequestPath.permissions,
                    key: CHANGE_REQUEST,
                    icon: props => <CategoryIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.registry),
                    permissions: paths.registryPath.permissions,
                    key: 'registry',
                    icon: props => <MenuBookIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.groups),
                    permissions: paths.groupsPath.permissions,
                    key: 'groups',
                    icon: props => <GroupWork {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.orgUnitType),
                    permissions: paths.orgUnitTypesPath.permissions,
                    key: 'types',
                    icon: props => <CategoryIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.dataSources),
                    key: 'sources',
                    icon: props => <DnsRoundedIcon {...props} />,
                    subMenu: [
                        {
                            label: formatMessage(MESSAGES.dataSourceList),
                            permissions: paths.dataSourcesPath.permissions,
                            key: 'list',
                            icon: props => <FormatListBulleted {...props} />,
                        },
                        {
                            label: formatMessage(MESSAGES.matching),
                            key: 'links',
                            icon: props => <Link {...props} />,
                            subMenu: [
                                {
                                    label: formatMessage(MESSAGES.linksList),
                                    permissions: paths.linksPath.permissions,
                                    key: 'list',
                                    icon: props => (
                                        <FormatListBulleted {...props} />
                                    ),
                                },
                                {
                                    label: formatMessage(
                                        MESSAGES.algorithmsRuns,
                                    ),
                                    permissions: paths.algosPath.permissions,
                                    key: 'runs',
                                    icon: props => <CompareArrows {...props} />,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            label: formatMessage(MESSAGES.beneficiaries),
            key: 'entities',
            icon: props => <BeneficiarySvg {...props} />,
            subMenu: [
                {
                    label: formatMessage(MESSAGES.entityTypesTitle),
                    permissions: paths.entityTypesPath.permissions,
                    key: 'types',
                    icon: props => <CategoryIcon {...props} />,
                },
                { ...beneficiariesListEntry },
                {
                    label: formatMessage(MESSAGES.entityDuplicatesTitle),
                    permissions: paths.entityDuplicatesPath.permissions,
                    key: 'duplicates',
                    icon: props => <FileCopyIcon {...props} />,
                },
            ],
        },
        {
            label: formatMessage(MESSAGES.storages),
            key: 'storages',
            permissions: paths.storagesPath.permissions,
            icon: props => <StorageIcon {...props} />,
        },
        {
            label: formatMessage(MESSAGES.payments),
            key: 'payments',
            dev: true,
            icon: props => <PaymentsIcon {...props} />,
            subMenu: [
                {
                    label: formatMessage(MESSAGES.potentialPayments),
                    permissions: paths.potentialPaymentsPath.permissions,
                    key: 'potential',
                    dev: true,
                    icon: props => <PriceCheckIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.lots),
                    permissions: paths.potentialPaymentsPath.permissions,
                    key: 'lots',
                    dev: true,
                    icon: props => <AccountBalanceIcon {...props} />,
                },
            ],
        },
        {
            label: formatMessage(MESSAGES.planning),
            key: 'planning',
            icon: props => <AssignmentIcon {...props} />,
            subMenu: [
                {
                    label: formatMessage(MESSAGES.planningList),
                    permissions: paths.planningPath.permissions,
                    key: 'list',
                    icon: props => <FormatListBulleted {...props} />,
                },
            ],
        },
        {
            label: formatMessage(MESSAGES.config),
            key: 'settings',
            icon: props => <Settings {...props} />,
            subMenu: [
                {
                    label: formatMessage(MESSAGES.tasks),
                    key: 'tasks',
                    permissions: paths.tasksPath.permissions,
                    icon: props => <AssignmentRoundedIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.monitoring),
                    key: 'devices',
                    permissions: paths.devicesPath.permissions,
                    icon: props => <ImportantDevicesRoundedIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.projects),
                    key: 'projects',
                    permissions: paths.projectsPath.permissions,
                    icon: props => <PhonelinkSetupIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.modules),
                    key: 'modules',
                    permissions: paths.modulesPath.permissions,
                    icon: props => <ViewModuleIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.users),
                    key: 'users',
                    permissions: paths.usersPath.permissions,
                    icon: props => <SupervisorAccount {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.userRoles),
                    key: 'userRoles',
                    permissions: paths.userRolesPath.permissions,
                    icon: props => <GroupsIcon {...props} />,
                },
                {
                    label: formatMessage(MESSAGES.teams),
                    permissions: paths.teamsPath.permissions,
                    key: 'teams',
                    icon: props => <GroupIcon {...props} />,
                },
            ],
        },
    ];
};

const filterDevFeatures = (items: MenuItems): MenuItems => {
    const result: MenuItems = [];
    items.forEach(item => {
        if (!item.subMenu && !item.dev) {
            result.push(item);
        } else if (item.subMenu && !item.dev) {
            const subMenu = filterDevFeatures(item.subMenu);
            const filtered = { ...item, subMenu };
            result.push(filtered);
        }
    });
    return result;
};

export const useMenuItems = (): MenuItems => {
    const currentUser = useCurrentUser();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const orgUnitExtraPath = useGetOrgunitsExtraPath();
    const { data: entityTypes } = useGetBeneficiaryTypesDropdown();
    const { plugins }: Plugins = useContext(PluginsContext);
    const pluginsMenu = plugins.map(plugin => plugin.menu).flat();
    const allBasicItems = useMemo(
        () => [
            ...menuItems(
                entityTypes || [],
                formatMessage,
                currentUser,
                orgUnitExtraPath,
            ),
        ],
        [currentUser, orgUnitExtraPath, entityTypes, formatMessage],
    );
    // Find admin entry
    const admin = allBasicItems.find(item => item.key === 'settings');
    const basicItems = allBasicItems.filter(item => item.key !== 'settings');

    // add feature flags
    if (hasFeatureFlag(currentUser, SHOW_PAGES)) {
        basicItems.push({
            label: formatMessage(MESSAGES.pages),
            key: 'pages',
            icon: props => <BookIcon {...props} />,
            permissions: paths.pagesPath.permissions,
        });
    }
    if (
        hasFeatureFlag(currentUser, SHOW_DHIS2_LINK) &&
        currentUser?.account?.default_version?.data_source.url
    ) {
        basicItems.push({
            label: formatMessage(MESSAGES.dhis2),
            key: 'dhis2',
            url: currentUser.account.default_version.data_source.url,
            icon: props => <DHIS2Svg {...props} />,
        });
    }

    const items: MenuItems = useMemo(() => {
        const menuItemsTemp = [
            ...(basicItems as MenuItems),
            ...(pluginsMenu as MenuItems),
        ];
        if (admin) {
            menuItemsTemp.push(admin as MenuItem);
        }
        const authorizedItems = menuItemsTemp.filter(menuItem => {
            const permissionsList = listMenuPermission(menuItem);
            return userHasOneOfPermissions(permissionsList, currentUser);
        });
        if (hasFeatureFlag(currentUser, SHOW_DEV_FEATURES)) {
            return authorizedItems;
        }
        // Remove dev (incomplete) features
        return filterDevFeatures(authorizedItems);
    }, [admin, basicItems, currentUser, pluginsMenu]);
    return items;
};
export const RDC_USER_MANUAL =
    'https://docs.google.com/document/d/1eSJWotpTn4OtI1TV9OjJeF0hIa8W_1nUtpg9tmEgCkw/edit?usp=sharing';
