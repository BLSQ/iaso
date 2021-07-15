import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
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

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import * as paths from './routes';
import { getPlugins } from '../utils/index';

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
                permission: paths.formsPath.permission,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.dhis2Mappings,
                permission: paths.mappingsPath.permission,
                key: 'mappings',
                icon: props => <DHIS2Svg {...props} />,
            },
            {
                label: MESSAGES.completeness,
                permission: paths.completenessPath.permission,
                key: 'completeness',
                icon: props => <DoneAll {...props} />,
            },
            {
                label: MESSAGES.archived,
                permission: paths.archivedPath.permission,
                key: 'archived',
                icon: props => <Delete {...props} />,
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
                permission: paths.orgUnitsPath.permission,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: MESSAGES.groups,
                permission: paths.groupsPath.permission,
                key: 'groups',
                icon: props => <GroupWork {...props} />,
            },
            {
                label: MESSAGES.orgUnitType,
                permission: paths.orgUnitTypesPath.permission,
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
                        permission: paths.dataSourcesPath.permission,
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
                                permission: paths.linksPath.permission,
                                key: 'list',
                                icon: props => (
                                    <FormatListBulleted {...props} />
                                ),
                            },
                            {
                                label: MESSAGES.algorithmsRuns,
                                permission: paths.algosPath.permission,
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
                permission: paths.tasksPath.permission,
                icon: props => <AssignmentRoundedIcon {...props} />,
            },
            {
                label: MESSAGES.monitoring,
                key: 'devices',
                permission: paths.devicesPath.permission,
                icon: props => <ImportantDevicesRoundedIcon {...props} />,
            },
            {
                label: MESSAGES.projects,
                key: 'projects',
                permission: paths.projectsPath.permission,
                icon: props => <PhonelinkSetupIcon {...props} />,
            },
            {
                label: MESSAGES.users,
                key: 'users',
                permission: paths.usersPath.permission,
                icon: props => <SupervisorAccount {...props} />,
            },
        ],
    },
];

if (PLUGIN_POLIO_ENABLED === 'True') {
    menuItems.push({
        label: MESSAGES.polio,
        key: 'polio',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.dashboard,
                key: 'list',
                permission: paths.formsPath.permission,
                icon: props => <FormatListBulleted {...props} />,
            },
        ],
    });
    menuItems.push({
        label: MESSAGES.pages,
        key: 'pages',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: MESSAGES.list,
                key: 'list',
                permission: paths.tasksPath.permission,
                icon: props => <FormatListBulleted {...props} />,
            },
        ],
    });
}

const pluginsMenu = getPlugins()
    .map(plugin => plugin.menu)
    .flat();

export default [...menuItems, ...pluginsMenu];
