import React from 'react';

import {
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import * as Permission from '../../utils/permissions.ts';
import getDisplayName, { useCurrentUser } from '../../utils/usersUtils.ts';
import { LinkToForm } from '../forms/components/LinkToForm.tsx';
import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import { OrgUnitLabel } from '../orgUnits/components/OrgUnitLabel.tsx';
import OrgUnitTooltip from '../orgUnits/components/OrgUnitTooltip';
import { usePrettyPeriod } from '../periods/utils';
import { LinkToPlanning } from '../plannings/components/LinkToPlanning.tsx';
import { userHasOneOfPermissions, userHasPermission } from '../users/utils';
import MESSAGES from './messages';

export const INSTANCE_STATUS_READY = 'READY';
export const INSTANCE_STATUS_ERROR = 'ERROR';
export const INSTANCE_STATUS_EXPORTED = 'EXPORTED';

export const INSTANCE_STATUSES = [
    INSTANCE_STATUS_READY,
    INSTANCE_STATUS_ERROR,
    INSTANCE_STATUS_EXPORTED,
];

export const REFERENCE_FLAG_CODE = 'flag';
export const REFERENCE_UNFLAG_CODE = 'unflag';

const PrettyPeriod = ({ value }) => {
    const formatPeriod = usePrettyPeriod();
    return formatPeriod(value);
};

export const INSTANCE_MAP_METAS_FIELDS = [
    {
        key: 'org_unit_type_name',
        type: 'info',
        renderValue: data => {
            return data.org_unit.org_unit_type.name;
        },
    },
    {
        key: 'org_unit_name',
        type: 'info',
        renderValue: data => {
            return <LinkToOrgUnit orgUnit={data.org_unit} />;
        },
    },
    {
        key: 'parent',
        type: 'info',
        renderValue: data => {
            return <LinkToOrgUnit orgUnit={data.org_unit.parent} />;
        },
    },
    {
        key: 'form_name',
        type: 'info',
        renderValue: data => {
            return (
                <LinkToForm formId={data.form_id} formName={data.form_name} />
            );
        },
    },
    {
        key: 'created_by',
        type: 'info',
        renderValue: data => {
            return data.created_by
                ? getDisplayName(data.created_by)
                : textPlaceholder;
        },
    },
    {
        key: 'created_at',
        render: value => displayDateFromTimestamp(value),
        type: 'info',
    },
    {
        key: 'org_unit',
        render: value => {
            if (!value) return null;
            return (
                <OrgUnitTooltip
                    key={value.id}
                    orgUnit={value}
                    domComponent="span"
                >
                    <OrgUnitLabel orgUnit={value} withType withSource={false} />
                </OrgUnitTooltip>
            );
        },
        type: 'location',
    },
];

const OrgUnitLabelHyperLink = ({ value }) => {
    const currentUser = useCurrentUser();
    const showOrgUnitLink =
        userHasOneOfPermissions(
            [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
            currentUser,
        ) && userHasPermission(Permission.SUBMISSIONS_UPDATE, currentUser);
    return (
        <OrgUnitTooltip key={value.id} orgUnit={value} domComponent="span">
            {showOrgUnitLink ? (
                <LinkToOrgUnit orgUnit={value} />
            ) : (
                <OrgUnitLabel orgUnit={value} withType withSource={false} />
            )}
        </OrgUnitTooltip>
    );
};

OrgUnitLabelHyperLink.propTypes = {
    value: PropTypes.object.isRequired,
};

export const INSTANCE_METAS_FIELDS = [
    {
        key: 'uuid',
        type: 'info',
    },
    {
        key: 'project_name',
        accessor: 'project__name',
        active: true,
        sortable: true,
        tableOrder: 1,
        type: 'info',
        renderValue: data => data.project_name || textPlaceholder,
        Cell: settings => {
            return settings.row.original.project_name || textPlaceholder;
        },
    },
    {
        key: 'form_name',
        accessor: 'form__name',
        active: true,
        tableOrder: 2,
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
            return textPlaceholder;
        },
    },

    {
        key: 'version',
        accessor: 'formVersion',
        active: false,
        sortable: false,
        tableOrder: 3,
        type: 'info',
        renderValue: data => {
            return data.file_content?._version || textPlaceholder;
        },
        Cell: settings => {
            const data = settings.row.original;
            return data.file_content?._version || textPlaceholder;
        },
    },
    {
        key: 'source_created_at',
        active: false,
        render: value => displayDateFromTimestamp(value),
        tableOrder: 7,
        type: 'info',
    },
    {
        key: 'updated_at',
        render: value => displayDateFromTimestamp(value),
        active: true,
        tableOrder: 4,
        type: 'info',
    },
    {
        key: 'created_at',
        active: false,
        render: value => displayDateFromTimestamp(value),
        tableOrder: 6,
        type: 'info',
    },
    {
        key: 'created_by__username',
        accessor: 'created_by__username',
        translationKey: 'created_by',
        active: false,
        tableOrder: 7,
        type: 'info',
        Cell: settings => {
            const data = settings.row.original;
            return data.created_by
                ? getDisplayName(data.created_by)
                : textPlaceholder;
        },
        renderValue: data => {
            return data.created_by
                ? getDisplayName(data.created_by)
                : textPlaceholder;
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
            return <OrgUnitLabelHyperLink value={value} />;
        },
        active: true,
        tableOrder: 5,
        type: 'location',
    },
    {
        key: 'period',
        render: value => <PrettyPeriod value={value} />,
        tableOrder: 6,
        active: true,
        type: 'info',
    },
    {
        key: 'status',
        render: value =>
            value && MESSAGES[value.toLowerCase()] ? (
                <FormattedMessage {...MESSAGES[value.toLowerCase()]} />
            ) : (
                textPlaceholder
            ),
        active: true,
        tableOrder: 7,
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
