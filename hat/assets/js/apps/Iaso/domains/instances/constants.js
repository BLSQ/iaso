import React from 'react';

import { displayDateFromTimestamp } from '../../utils/intlUtil';
import OrgUnitDisplay from '../orgUnits/components/OrgUnitDisplay';
import { Period } from '../periods/models';
import { getOrgunitMessage } from '../orgUnits/utils';
import { FormattedMessage } from 'react-intl';

export const INSTANCE_STATUS_READY = 'READY';
export const INSTANCE_STATUS_ERROR = 'ERROR';
export const INSTANCE_STATUS_EXPORTED = 'EXPORTED';

export const INSTANCE_STATUSES = [
    INSTANCE_STATUS_READY,
    INSTANCE_STATUS_ERROR,
    INSTANCE_STATUS_EXPORTED,
];

export const INSTANCE_METAS_FIELDS = [
    {
        key: 'uuid',
        type: 'info',
    },
    {
        key: 'updated_at',
        render: value => displayDateFromTimestamp(value),
        tableOrder: 1,
        type: 'info',
    },
    {
        key: 'created_at',
        render: value => displayDateFromTimestamp(value),
        tableOrder: 4,
        type: 'info',
    },
    {
        key: 'device_id',
        type: 'info',
    },
    {
        key: 'org_unit',
        accessor: 'org_unit__name',
        render: value => (<OrgUnitDisplay orgUnit={value} />),
        title: value => getOrgunitMessage(value),
        tableOrder: 2,
        type: 'location',
    },
    {
        key: 'latitude',
        type: 'location',
    },
    {
        key: 'longitude',
        type: 'location',
    },
    {
        key: 'period',
        render: value => Period.getPrettyPeriod(value),
        tableOrder: 3,
        type: 'info',
    },
    {
        key: 'status',
        render: value => value ? <FormattedMessage id={"iaso.label.instanceStatus."+value.toLowerCase()+"Single"} defaultMessage={value} /> : "-",
        tableOrder: 5,
        type: 'info',
    }
];
