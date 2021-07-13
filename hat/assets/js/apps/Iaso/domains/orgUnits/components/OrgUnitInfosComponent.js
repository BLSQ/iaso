import React from 'react';

import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';
import moment from 'moment';

import { injectIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import OrgUnitsLevelsFiltersComponent from './OrgUnitsLevelsFiltersComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

import MESSAGES from '../../forms/messages';
import FormControlComponent from '../../../components/forms/FormControlComponent';

import { getDisplayedDateHourFormat } from '../../../utils/dates';

const OrgUnitInfosComponent = ({
    orgUnit,
    onChangeInfo,
    orgUnitTypes,
    intl: { formatMessage },
    baseUrl,
    params,
    groups,
}) => (
    <Grid container spacing={4}>
        <Grid item xs={orgUnit.id ? 4 : 6}>
            <InputComponent
                keyValue="name"
                required
                onChange={onChangeInfo}
                value={orgUnit.name.value}
                errors={orgUnit.name.errors}
                label={MESSAGES.name}
            />
            <InputComponent
                keyValue="org_unit_type_id"
                onChange={onChangeInfo}
                required
                value={orgUnit.org_unit_type_id.value}
                errors={orgUnit.org_unit_type_id.errors}
                type="select"
                options={orgUnitTypes.map(t => ({
                    label: t.name,
                    value: t.id,
                }))}
                label={MESSAGES.org_unit_type_id}
            />
            <InputComponent
                keyValue="groups"
                onChange={(name, value) =>
                    onChangeInfo(name, commaSeparatedIdsToArray(value))
                }
                multi
                value={
                    orgUnit.groups.value.length > 0
                        ? orgUnit.groups.value
                        : null
                }
                errors={orgUnit.groups.errors}
                type="select"
                options={groups.map(g => ({
                    label: g.name,
                    value: g.id,
                }))}
                label={MESSAGES.groups}
            />
            <InputComponent
                keyValue="validation_status"
                isClearable={false}
                onChange={onChangeInfo}
                errors={orgUnit.validation_status.errors}
                value={orgUnit.validation_status.value}
                type="select"
                label={MESSAGES.status}
                options={[
                    {
                        label: formatMessage(MESSAGES.new),
                        value: 'NEW',
                    },
                    {
                        label: formatMessage(MESSAGES.validated),
                        value: 'VALID',
                    },
                    {
                        label: formatMessage(MESSAGES.rejected),
                        value: 'REJECTED',
                    },
                ]}
            />
            <InputComponent
                keyValue="source_ref"
                value={orgUnit.source_ref.value || ''}
                onChange={onChangeInfo}
                errors={orgUnit.source_ref.errors}
            />
            <InputComponent
                keyValue="aliases"
                onChange={onChangeInfo}
                value={orgUnit.aliases.value}
                type="arrayInput"
            />
        </Grid>
        <Grid item xs={orgUnit.id ? 4 : 6}>
            <FormControlComponent errors={orgUnit.parent_id.errors}>
                <OrgUnitsLevelsFiltersComponent
                    onLatestIdChanged={latestId => {
                        if (latestId !== orgUnit.parent_id.value) {
                            onChangeInfo('parent_id', latestId);
                        }
                    }}
                    params={params}
                    defaultVersion={params.orgUnitId === '0'}
                    baseUrl={baseUrl}
                    showCurrentOrgUnit={false}
                    currentOrgUnitId={orgUnit.id}
                    source={orgUnit.source_id}
                />
            </FormControlComponent>
        </Grid>
        {orgUnit.id && (
            <Grid item xs={4}>
                <InputComponent
                    keyValue="source"
                    value={orgUnit.source}
                    disabled
                    label={MESSAGES.source}
                />
                <InputComponent
                    keyValue="created_at"
                    value={moment
                        .unix(orgUnit.created_at)
                        .format('LTS')}
                    disabled
                />
                <InputComponent
                    keyValue="updated_at"
                    value={moment
                        .unix(orgUnit.updated_at)
                        .format('LTS')}
                    disabled
                />
            </Grid>
        )}
    </Grid>
);

OrgUnitInfosComponent.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
};

export default injectIntl(OrgUnitInfosComponent);
