import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import CompareArrows from '@material-ui/icons/CompareArrows';
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';
import PhonelinkSetupIcon from '@material-ui/icons/PhonelinkSetup';
import StorageRoundedIcon from '@material-ui/icons/StorageRounded';
import DoneAll from '@material-ui/icons/DoneAll';
import Settings from '@material-ui/icons/Settings';
import GroupWork from '@material-ui/icons/GroupWork';
import CategoryIcon from '@material-ui/icons/Category';

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import * as paths from './routes';

import MESSAGES from './messages';

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
                icon: props => <StorageRoundedIcon {...props} />,
                subMenu: [
                    {
                        label: MESSAGES.list,
                        permission: paths.dataSourcesPath.permission,
                        key: 'list',
                        icon: props => <FormatListBulleted {...props} />,
                    },
                    {
                        label: MESSAGES.matching,
                        permission: paths.linksPath.permission,
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

export default menuItems;
