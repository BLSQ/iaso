import React from 'react';
import { injectIntl } from 'react-intl';

import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';
import moment from 'moment';

import InputComponent from '../../../components/forms/InputComponent';
import OrgUnitsLevelsFiltersComponent from './OrgUnitsLevelsFiltersComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

import { useFormState } from '../../../hooks/form';

import MESSAGES from '../../forms/messages';

function OrgUnitInfosComponent(props) {
    const {
        orgUnit,
        onChangeInfo,
        orgUnitTypes,
        intl: {
            formatMessage,
        },
        baseUrl,
        params,
        groups,
    } = props;

    const [formState, setFieldValue, setFieldErrors] = useFormState({
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit.org_unit_type_id,
        groups: orgUnit.groups.map(g => g.id),
        sub_source: orgUnit.sub_source,
        status: orgUnit.status,
        aliases: orgUnit.aliases,
    });

    return (
        <Grid container spacing={4}>
            <Grid item xs={4}>
                <InputComponent
                    keyValue="name"
                    onChange={setFieldValue}
                    value={formState.name.value}
                    label={MESSAGES.name}
                />
                <InputComponent
                    keyValue="org_unit_type_id"
                    onChange={setFieldValue}
                    value={formState.org_unit_type_id.value}
                    type="select"
                    options={
                        orgUnitTypes.map(t => ({
                            label: t.name,
                            value: t.id,
                        }))
                    }
                    label={MESSAGES.org_unit_type_id}
                />
                <InputComponent
                    keyValue="groups"
                    onChange={(name, value) => setFieldValue(name, commaSeparatedIdsToArray(value))}
                    multi
                    value={formState.groups.value}
                    type="select"
                    options={
                        groups.map(g => ({
                            label: g.name,
                            value: g.id,
                        }))
                    }
                    label={MESSAGES.groups}
                />
                <InputComponent
                    keyValue="validation_status"
                    isClearable={false}
                    onChange={onChangeInfo}
                    value={orgUnit.validation_status}
                    type="select"
                    label={MESSAGES.status}
                    options={
                        [
                            {
                                label: formatMessage(MESSAGES.new),
                                value: "NEW",
                            },
                            {
                                label: formatMessage(MESSAGES.validated),
                                value: "VALID",
                            },
                            {
                                label: formatMessage(MESSAGES.rejected),
                                value: "REJECTED",
                            },
                        ]
                    }
                />
                <InputComponent
                    keyValue="aliases"
                    onChange={setFieldValue}
                    value={formState.aliases.value}
                    type="arrayInput"
                />
            </Grid>
            <Grid item xs={4}>
                <OrgUnitsLevelsFiltersComponent
                    onLatestIdChanged={(latestId) => {
                        if (latestId !== orgUnit.parent_id) {
                            onChangeInfo('parent_id', latestId);
                        }
                    }}
                    params={params}
                    baseUrl={baseUrl}
                    showCurrentOrgUnit={false}
                    currentOrgUnitId={orgUnit.id}
                    source={orgUnit.source_id}
                />
            </Grid>
            <Grid item xs={4}>
                <InputComponent
                    keyValue="source"
                    value={orgUnit.source}
                    disabled
                    label={MESSAGES.source}
                />
                <InputComponent
                    keyValue="source_ref"
                    value={orgUnit.source_ref}
                    disabled
                />
                <InputComponent
                    keyValue="created_at"
                    value={moment.unix(orgUnit.created_at).format('DD/MM/YYYY HH:mm')}
                    disabled
                />
                <InputComponent
                    keyValue="updated_at"
                    value={moment.unix(orgUnit.updated_at).format('DD/MM/YYYY HH:mm')}
                    disabled
                />
            </Grid>
        </Grid>
    );
}

OrgUnitInfosComponent.defaultProps = {
    orgUnit: {
        id: null,
        name: '',
        org_unit_type_id: null,
        groups: [],
        sub_source: null,
        status: false,
        aliases: [],
    },
};
OrgUnitInfosComponent.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object,
    orgUnitTypes: PropTypes.array.isRequired,
    sources: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
};


export default injectIntl(OrgUnitInfosComponent);
