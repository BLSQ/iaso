import React from 'react';

import { FormattedMessage } from 'react-intl';
import { displayDateFromTimestamp } from 'bluesquare-components';
import OrgUnitTooltip from '../orgUnits/components/OrgUnitTooltip';
import { usePrettyPeriod } from '../periods/utils';
import { OrgUnitLabel } from '../orgUnits/utils';
import MESSAGES from './messages';
import { LinkToForm } from '../forms/components/LinkToForm.tsx';
import { LinkToPlanning } from '../plannings/components/LinkToPlanning.tsx';
import getDisplayName from '../../utils/usersUtils.ts';

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
        key: 'uuid',
        type: 'info',
    },
    {
        key: 'form_name',
        accessor: 'form__name',
        active: true,
        tableOrder: 1,
        type: 'info',
        renderValue: data => (
            <LinkToForm formId={data.form_id} formName={data.form_name} />
        ),
        Cell: settings => {
            const data = settings.row.original;
            return (
                <LinkToForm formId={data.form_id} formName={data.form_name} />
            );
        },
    },
    {
        key: 'planning',
        type: 'info',
        renderValue: data => {
            if (data.planning_id) {
                return (
                    <LinkToPlanning
                        planning={{
                            id: data.planning_id,
                            name: data.planning_name,
                            team: data.team_id,
                        }}
                    />
                );
            }
            return '--';
        },
    },

    {
        key: 'version',
        accessor: 'formVersion',
        active: false,
        sortable: false,
        tableOrder: 2,
        type: 'info',
        renderValue: data => {
            return data.file_content?._version || '--';
        },
        Cell: settings => {
            const data = settings.row.original;
            return data.file_content?._version || '--';
        },
    },
    {
        key: 'updated_at',
        render: value => displayDateFromTimestamp(value),
        active: true,
        tableOrder: 3,
        type: 'info',
    },
    {
        key: 'created_at',
        active: false,
        render: value => displayDateFromTimestamp(value),
        tableOrder: 5,
        type: 'info',
    },
    {
        key: 'created_by__username',
        accessor: 'created_by__username',
        translationKey: 'created_by',
        active: false,
        tableOrder: 6,
        type: 'info',
        Cell: settings => {
            const data = settings.row.original;
            return (
                <>{data.created_by ? getDisplayName(data.created_by) : '--'}</>
            );
        },
        renderValue: data => {
            return (
                <>{data.created_by ? getDisplayName(data.created_by) : '--'}</>
            );
        },
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
                        <OrgUnitLabel
                            orgUnit={value}
                            withType
                            withSource={false}
                        />
                    </>
                </OrgUnitTooltip>
            );
        },
        active: true,
        tableOrder: 4,
        type: 'location',
    },
    {
        key: 'period',
        render: value => <PrettyPeriod value={value} />,
        tableOrder: 3,
        active: true,
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
        active: true,
        tableOrder: 6,
        type: 'info',
    },
    {
        key: 'last_modified_by',
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
    'planningIds',
    'userIds',
    'modificationDateFrom',
    'modificationDateTo',
    'sentDateFrom;',
    'sentDateTo',
    'dateTo',
];
