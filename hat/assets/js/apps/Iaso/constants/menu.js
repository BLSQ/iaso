import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import Input from '@material-ui/icons/Input';
import CompareArrows from '@material-ui/icons/CompareArrows';
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';
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

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import BeneficiarySvg from '../components/svg/Beneficiary';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import * as paths from './routes';
import {
    hasFeatureFlag,
    SHOW_PAGES,
    SHOW_DHIS2_LINK,
} from '../utils/featureFlags';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';
import { getChipColors } from './chipColors';

import MESSAGES from './messages';

// !! remove permission property if the menu has a subMenu !!
const menuItems = defaultSourceId => [
    {
        label: MESSAGES.formsTitle,
        key: 'forms',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.list,
                permissions: paths.formsPath.permissions,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.submissionsTitle,
                extraPath: `/tab/list/mapResults/${locationLimitMax}`,
                permissions: paths.instancesPath.permissions,
                key: 'submissions',
                icon: props => <Input {...props} />,
            },
            {
                label: MESSAGES.formsStats,
                permissions: paths.formsStatsPath.permissions,
                key: 'stats',
                icon: props => <AssessmentIcon {...props} />,
            },
            {
                label: MESSAGES.dhis2Mappings,
                permissions: paths.mappingsPath.permissions,
                key: 'mappings',
                icon: props => <DHIS2Svg {...props} />,
            },
            {
                label: MESSAGES.completeness,
                permissions: paths.completenessPath.permissions,
                key: 'completeness',
                icon: props => <DoneAll {...props} />,
            },
            {
                label: MESSAGES.completenessStats,
                permissions: paths.completenessStatsPath.permissions,
                key: 'completenessStats',
                icon: props => <DoneAll {...props} />,
            },
        ],
    },
    {
        label: MESSAGES.orgUnitsTitle,
        key: 'orgunits',
        icon: props => <OrgUnitSvg {...props} />,
        subMenu: [
            {
                label: MESSAGES.list,
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
                label: MESSAGES.groups,
                permissions: paths.groupsPath.permissions,
                key: 'groups',
                icon: props => <GroupWork {...props} />,
            },
            {
                label: MESSAGES.orgUnitType,
                permissions: paths.orgUnitTypesPath.permissions,
                key: 'types',
                icon: props => <CategoryIcon {...props} />,
            },
            {
                label: MESSAGES.dataSources,
                key: 'sources',
                icon: props => <DnsRoundedIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.list,
                        permissions: paths.dataSourcesPath.permissions,
                        key: 'list',
                        icon: props => <FormatListBulleted {...props} />,
                    },
                    {
                        label: MESSAGES.matching,
                        key: 'links',
                        icon: props => <Link {...props} />,
                        subMenu: [
                            {
                                label: MESSAGES.list,
                                permissions: paths.linksPath.permissions,
                                key: 'list',
                                icon: props => (
                                    <FormatListBulleted {...props} />
                                ),
                            },
                            {
                                label: MESSAGES.algorithmsRuns,
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
        label: MESSAGES.beneficiaries,
        key: 'entities',
        icon: props => <BeneficiarySvg {...props} />,
        subMenu: [
            {
                label: MESSAGES.list,
                permissions: paths.entitiesPath.permissions,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.entityTypesTitle,
                permissions: paths.entityTypesPath.permissions,
                key: 'types',
                icon: props => <CategoryIcon {...props} />,
            },
        ],
    },
    {
        label: MESSAGES.storages,
        key: 'storages',
        permissions: paths.storagesPath.permissions,
        icon: props => <StorageIcon {...props} />,
    },
    {
        label: MESSAGES.planning,
        key: 'planning',
        icon: props => <AssignmentIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.list,
                permissions: paths.planningPath.permissions,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
        ],
    },
    {
        label: MESSAGES.config,
        key: 'settings',
        icon: props => <Settings {...props} />,
        subMenu: [
            {
                label: MESSAGES.tasks,
                key: 'tasks',
                permissions: paths.tasksPath.permissions,
                icon: props => <AssignmentRoundedIcon {...props} />,
            },
            {
                label: MESSAGES.monitoring,
                key: 'devices',
                permissions: paths.devicesPath.permissions,
                icon: props => <ImportantDevicesRoundedIcon {...props} />,
            },
            {
                label: MESSAGES.projects,
                key: 'projects',
                permissions: paths.projectsPath.permissions,
                icon: props => <PhonelinkSetupIcon {...props} />,
            },
            {
                label: MESSAGES.users,
                key: 'users',
                permissions: paths.usersPath.permissions,
                icon: props => <SupervisorAccount {...props} />,
            },
            {
                label: MESSAGES.teams,
                permissions: paths.teamsPath.permissions,
                key: 'teams',
                icon: props => <GroupIcon {...props} />,
            },
        ],
    },
];

const getMenuItems = (currentUser, enabledPlugins, defaultSourceVersion) => {
    const pluginsMenu = enabledPlugins.map(plugin => plugin.menu).flat();
    const allBasicItems = [...menuItems(defaultSourceVersion?.source?.id)];
    // Find admin entry
    const admin = allBasicItems.find(item => item.key === 'settings');
    const basicItems = allBasicItems.filter(item => item.key !== 'settings');

    if (hasFeatureFlag(currentUser, SHOW_PAGES)) {
        basicItems.push({
            label: MESSAGES.pages,
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
            label: MESSAGES.dhis2,
            key: 'dhis2',
            url: currentUser.account.default_version.data_source.url,
            icon: props => <DHIS2Svg {...props} />,
        });
    }
    return [...basicItems, ...pluginsMenu, admin];
};

export default getMenuItems;
