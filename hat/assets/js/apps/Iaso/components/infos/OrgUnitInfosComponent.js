import React from 'react';
import { injectIntl } from 'react-intl';

import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';
import moment from 'moment';

import InputComponent from '../forms/InputComponent';
import OrgUnitsLevelsFiltersComponent from '../filters/OrgUnitsLevelsFiltersComponent';

import MESSAGES from '../forms/messages';

function OrgUnitInfosComponent(props) {
    const {
        orgUnit,
        onChangeInfo,
        orgUnitTypes,
        sourceTypes,
        sources,
        intl: {
            formatMessage,
        },
        baseUrl,
        params,
    } = props;
    return (
        <Grid container spacing={4}>
            <Grid item xs={4}>
                <InputComponent
                    keyValue="name"
                    onChange={onChangeInfo}
                    value={orgUnit.name}
                    label={MESSAGES.name}
                />
                <InputComponent
                    keyValue="org_unit_type_id"
                    onChange={onChangeInfo}
                    value={orgUnit.org_unit_type_id}
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
                    keyValue="sub_source"
                    onChange={onChangeInfo}
                    value={orgUnit.sub_source}
                    type="select"
                    options={
                        sourceTypes.map(s => ({
                            label: formatMessage(MESSAGES[s[0]]),
                            value: s[0],
                        }))
                    }
                    label={MESSAGES.subSource}
                />
                <InputComponent
                    keyValue="status"
                    isClearable={false}
                    onChange={onChangeInfo}
                    value={orgUnit.status}
                    type="select"
                    label={MESSAGES.status}
                    options={
                        [
                            {
                                label: formatMessage(MESSAGES.validated),
                                value: true,
                            },
                            {
                                label: formatMessage(MESSAGES.notValidated),
                                value: false,
                            },
                        ]
                    }
                />
                <InputComponent
                    keyValue="aliases"
                    onChange={onChangeInfo}
                    value={orgUnit.aliases}
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

OrgUnitInfosComponent.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sourceTypes: PropTypes.array.isRequired,
    sources: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
};


export default injectIntl(OrgUnitInfosComponent);
