import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import CompareArrows from '@material-ui/icons/CompareArrows';
import DoneAll from '@material-ui/icons/DoneAll';
import Settings from '@material-ui/icons/Settings';

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';
import DHIS2Svg from '../components/svg/DHIS2SvgComponent';

const menuItems = [
    {
        label: {
            defaultMessage: 'Forms',
            id: 'iaso.forms.title',
        },
        key: 'forms',
        icon: props => <DataSourceIcon {...props} />,
    },
    {
        label: {
            defaultMessage: 'Org units',
            id: 'iaso.orgUnits.title',
        },
        key: 'orgunits',
        icon: props => <OrgUnitSvg {...props} />,
    },
    {
        label: {
            defaultMessage: 'Matching',
            id: 'iaso.matching.title',
        },
        key: 'links',
        icon: props => <Link {...props} />,
        subMenu: [
            {
                label: {
                    defaultMessage: 'List',
                    id: 'iaso.label.list',
                },
                key: 'list',
                icon: props => <FormatListBulleted {...props} />,
            },
            {
                label: {
                    defaultMessage: 'Algorithms runs',
                    id: 'iaso.label.algorithmsRuns',
                },
                key: 'runs',
                icon: props => <CompareArrows {...props} />,
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
                    defaultMessage: 'DHIS mappings',
                    id: 'iaso.label.dhis2Mappings',
                },
                key: 'mappings',
                icon: props => <DHIS2Svg {...props} />,
            },
        ],
    },
];
if (window.location.href.indexOf('/completeness') !== -1) {
    menuItems.push(
        {
            label: {
                defaultMessage: 'Completeness',
                id: 'iaso.completeness.title',
            },
            key: 'completeness',
            icon: props => <DoneAll {...props} />,
        },
    );
}

export default menuItems;
