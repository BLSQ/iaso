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
import Delete from '@material-ui/icons/Delete';
import Settings from '@material-ui/icons/Settings';
import GroupWork from '@material-ui/icons/GroupWork';
import CategoryIcon from '@material-ui/icons/Category';
import AssignmentRoundedIcon from '@material-ui/icons/AssignmentRounded';
import ImportantDevicesRoundedIcon from '@material-ui/icons/ImportantDevicesRounded';
import BookIcon from '@material-ui/icons/Book';
import AssessmentIcon from '@material-ui/icons/Assessment';

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import * as paths from './routes';
import { hasFeatureFlag, SHOW_PAGES } from '../utils/featureFlags';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';

import MESSAGES from './messages';

// !! remove permission property if the menu has a subMenu !!

const menuItems = [
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
        ],
    },
];

const getMenuItems = (currentUser, enabledPlugins) => {
    const pluginsMenu = enabledPlugins.map(plugin => plugin.menu).flat();
    const basicItems = [...menuItems];
    if (hasFeatureFlag(currentUser, SHOW_PAGES)) {
        basicItems.push({
            label: MESSAGES.pages,
            key: 'pages',
            icon: props => <BookIcon {...props} />,
            permissions: paths.pagesPath.permissions,
        });
    }
    return [...basicItems, ...pluginsMenu];
};

export default getMenuItems;
