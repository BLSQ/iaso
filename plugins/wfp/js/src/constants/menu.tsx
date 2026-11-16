import React from 'react';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { MenuItem } from 'Iaso/domains/app/types';
import MESSAGES from '../domains/beneficiaries/messages';
import { wfpBeneficiariesPath } from './routes';

// The "entities" key adds the sub menu to the Entities menu of IASO
export const menu: MenuItem[] = [
    {
        label: MESSAGES.entities,
        key: 'entities',
        subMenu: [
            {
                label: MESSAGES.entities,
                key: 'wfp-beneficiaries',
                permissions: wfpBeneficiariesPath.permissions,
                icon: props => <AssignmentIndIcon {...props} />,
            },
        ],
    },
];
