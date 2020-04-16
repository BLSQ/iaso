import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import CompareArrows from '@material-ui/icons/CompareArrows';
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';
import DoneAll from '@material-ui/icons/DoneAll';
import Settings from '@material-ui/icons/Settings';

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import * as paths from './paths';

const menuItems = [
    {
        label: {
            defaultMessage: 'Forms',
            id: 'iaso.forms.title',
        },
        key: 'forms',
        icon: props => <DataSourceIcon {...props} />,
        subMenu: [
            {
                label: {
                    defaultMessage: 'List',
                    id: 'iaso.label.list',
                },
                permission: paths.formsPath.permission,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: {
                    defaultMessage: 'DHIS mappings',
                    id: 'iaso.label.dhis2Mappings',
                },
                permission: paths.mappingsPath.permission,
                key: 'mappings',
                icon: props => <DHIS2Svg {...props} />,
            },
            {
                label: {
                    defaultMessage: 'Completeness',
                    id: 'iaso.completeness.title',
                },
                permission: paths.completenessPath.permission,
                key: 'completeness',
                icon: props => <DoneAll {...props} />,
            },
        ],
    },
    {
        label: {
            defaultMessage: 'Org units',
            id: 'iaso.orgUnits.title',
        },
        key: 'orgunits',
        icon: props => <OrgUnitSvg {...props} />,
        subMenu: [
            {
                label: {
                    defaultMessage: 'List',
                    id: 'iaso.label.list',
                },
                permission: paths.orgUnitsPath.permission,
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: {
                    defaultMessage: 'Matching',
                    id: 'iaso.matching.title',
                },
                permission: paths.linksPath.permission,
                key: 'links',
                icon: props => <Link {...props} />,
                subMenu: [
                    {
                        label: {
                            defaultMessage: 'List',
                            id: 'iaso.label.list',
                        },
                        permission: paths.linksPath.permission,
                        key: 'list',
                        icon: props => <FormatListBulleted {...props} />,
                    },
                    {
                        label: {
                            defaultMessage: 'Algorithms runs',
                            id: 'iaso.label.algorithmsRuns',
                        },
                        permission: paths.algosPath.permission,
                        key: 'runs',
                        icon: props => <CompareArrows {...props} />,
                    },
                ],
            },
        ],
    },
    {
        label: {
            defaultMessage: 'Configuration',
            id: 'iaso.label.config',
        },
        key: 'settings',
        icon: props => <Settings {...props} />,
        subMenu: [
            {
                label: {
                    defaultMessage: 'Users',
                    id: 'iaso.label.users',
                },
                key: 'users',
                permission: paths.usersPath.permission,
                icon: props => <SupervisorAccount {...props} />,
            },
        ],
    },
];

export default menuItems;
