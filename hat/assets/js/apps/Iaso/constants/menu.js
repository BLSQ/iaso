import React from 'react';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import CompareArrows from '@material-ui/icons/CompareArrows';

import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';

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
];

export default menuItems;
