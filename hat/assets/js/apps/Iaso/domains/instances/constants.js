import React from 'react';

import { FormattedMessage } from 'react-intl';
import { displayDateFromTimestamp } from 'bluesquare-components';
import { Link } from 'react-router';
import OrgUnitTooltip from '../orgUnits/components/OrgUnitTooltip';
import { usePrettyPeriod } from '../periods/utils';
import { OrgUnitLabel } from '../orgUnits/utils';
import MESSAGES from './messages';

export const INSTANCE_STATUS_READY = 'READY';
export const INSTANCE_STATUS_ERROR = 'ERROR';
export const INSTANCE_STATUS_EXPORTED = 'EXPORTED';

export const INSTANCE_STATUSES = [
    INSTANCE_STATUS_READY,
    INSTANCE_STATUS_ERROR,
    INSTANCE_STATUS_EXPORTED,
];

const PrettyPeriod = ({ value }) => {
    const formatPeriod = usePrettyPeriod();
    return formatPeriod(value);
};

export const INSTANCE_METAS_FIELDS = [
    {
        labelKey: 'version',
        key: 'file_content._version',
        type: 'info',
    },
    {
        key: 'uuid',
        type: 'info',
    },
    {
        key: 'form_name',
        accessor: 'form__name',
        tableOrder: 1,
        type: 'info',
        Cell: settings => {
            const data = settings.row.original;
            const formUrl = `/forms/detail/formId/${data.form_id}`;
            return <Link to={formUrl}>{data.form_name}</Link>;
        },
    },
    {
        key: 'updated_at',
        render: value => displayDateFromTimestamp(value),
        tableOrder: 2,
        type: 'info',
    },
    {
        key: 'created_at',
        render: value => displayDateFromTimestamp(value),
        tableOrder: 5,
        type: 'info',
    },
    {
        key: 'device_id',
        type: 'info',
    },
    {
        key: 'org_unit',
        accessor: 'org_unit__name',
        render: value => {
            if (!value) return null;
            return (
                <OrgUnitTooltip
                    key={value.id}
                    orgUnit={value}
                    domComponent="span"
                >
                    <>
                        <OrgUnitLabel orgUnit={value} withType />
                    </>
                </OrgUnitTooltip>
            );
        },
        tableOrder: 3,
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
        render: value => <PrettyPeriod value={value} />,
        tableOrder: 3,
        type: 'info',
    },
    {
        key: 'status',
        render: value =>
            value ? (
                <FormattedMessage {...MESSAGES[value.toLowerCase()]} />
            ) : (
                '-'
            ),
        tableOrder: 5,
        type: 'info',
    },
];

export const filtersKeys = [
    'formIds',
    'withLocation',
    'showDeleted',
    'orgUnitTypeId',
    'periods',
    'status',
    'deviceId',
    'deviceOwnershipId',
    'search',
    'levels',
    'dateFrom',
    'dateTo',
];
