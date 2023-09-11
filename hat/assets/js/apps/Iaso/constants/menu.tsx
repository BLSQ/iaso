/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactNode, useContext, useMemo } from 'react';

import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import Input from '@material-ui/icons/Input';
import CompareArrows from '@material-ui/icons/CompareArrows';
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';
import GroupsIcon from '@mui/icons-material/Groups';
import PhonelinkSetupIcon from '@material-ui/icons/PhonelinkSetup';
import DnsRoundedIcon from '@material-ui/icons/DnsRounded';
import DoneAll from '@material-ui/icons/DoneAll';
import Settings from '@material-ui/icons/Settings';
import GroupWork from '@material-ui/icons/GroupWork';
import CategoryIcon from '@material-ui/icons/Category';
import AssignmentRoundedIcon from '@material-ui/icons/AssignmentRounded';
import ImportantDevicesRoundedIcon from '@material-ui/icons/ImportantDevicesRounded';
import BookIcon from '@material-ui/icons/Book';
import AssessmentIcon from '@material-ui/icons/Assessment';
import GroupIcon from '@material-ui/icons/Group';
import AssignmentIcon from '@material-ui/icons/Assignment';
import StorageIcon from '@material-ui/icons/Storage';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ViewModuleIcon from '@material-ui/icons/ViewModule';

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
} from '../utils/featureFlags';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';
import { getChipColors } from './chipColors';

import MESSAGES from './messages';
import { useCurrentUser } from '../utils/usersUtils';
import {
    listMenuPermission,
    userHasOneOfPermissions,
} from '../domains/users/utils';
import { PluginsContext } from '../utils';
import { getDefaultSourceVersion } from '../domains/dataSources/utils';
import { useGetBeneficiaryTypesDropdown } from '../domains/entities/hooks/requests';
import { DropdownOptions } from '../types/utils';

type MenuItem = {
    label: string;
    permissions?: string[];
    key?: string;
    mapKey?: string;
    // eslint-disable-next-line no-unused-vars
    icon?: (props: Record<string, any>) => ReactNode;
    subMenu?: MenuItems;
    extraPath?: string;
    url?: string;
    // eslint-disable-next-line no-unused-vars
    isActive?: (pathname: string) => boolean;
};
type MenuItems = MenuItem[];
type Plugins = {
    plugins: Record<string, any>[];
};
// !! remove permission property if the menu has a subMenu !!
const menuItems = (
    entityTypes: Array<DropdownOptions<number>>,
    formatMessage: IntlFormatMessage,
    currentUser,
    defaultSourceId?: number,
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
            extraPath: `/entityTypeIds/${entityType.value}/order/last_saved_instance/pageSize/20/page/1`,
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
                    extraPath: `/locationLimit/${locationLimitMax}/order/id/pageSize/50/page/1/searchTabIndex/0/searches/[{"validation_status":"all","color":"${getChipColors(
                        0,
                    ).replace('#', '')}"${
                        defaultSourceId ? `,"source":${defaultSourceId}` : ''
                    }}]`,
                    key: 'list',
                    icon: props => <FormatListBulleted {...props} />,
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

export const useMenuItems = (): MenuItems => {
    const currentUser = useCurrentUser();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const defaultSourceVersion = getDefaultSourceVersion(currentUser);
    const { data: entityTypes } = useGetBeneficiaryTypesDropdown();
    const { plugins }: Plugins = useContext(PluginsContext);
    const pluginsMenu = plugins.map(plugin => plugin.menu).flat();
    const allBasicItems = useMemo(
        () => [
            ...menuItems(
                entityTypes || [],
                formatMessage,
                currentUser,
                defaultSourceVersion?.source?.id,
            ),
        ],
        [
            currentUser,
            defaultSourceVersion?.source?.id,
            entityTypes,
            formatMessage,
        ],
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

    // filter by user permissions
    const items = [...basicItems, ...pluginsMenu, admin].filter(menuItem => {
        const permissionsList = listMenuPermission(menuItem);
        return userHasOneOfPermissions(permissionsList, currentUser);
    });
    return items;
};
