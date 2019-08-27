import React from 'react';
import { injectIntl } from 'react-intl';

import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';
import moment from 'moment';

import InputComponent from '../forms/InputComponent';

import MESSAGES from '../forms/messages';

function OrgUnitInfosComponent(props) {
    const {
        orgUnit,
        onChangeInfo,
        orgUnitTypes,
        sourceTypes,
        intl: {
            formatMessage,
        },
    } = props;
    return (
        <Grid container spacing={4}>
            <Grid item xs={4}>
                <InputComponent
                    keyValue="name"
                    onChange={onChangeInfo}
                    value={orgUnit.name}
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
                />
                <InputComponent
                    keyValue="aliases"
                    onChange={onChangeInfo}
                    value={orgUnit.aliases}
                    type="arrayInput"
                />
            </Grid>
            <Grid item xs={4}>
                <InputComponent
                    keyValue="source"
                    onChange={onChangeInfo}
                    value={orgUnit.source}
                    type="select"
                    options={
                        sourceTypes.map(s => ({
                            label: formatMessage(MESSAGES[s[0]]),
                            value: s[0],
                        }))
                    }
                />
                <InputComponent
                    keyValue="status"
                    isClearable={false}
                    onChange={onChangeInfo}
                    value={orgUnit.status}
                    type="select"
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
            </Grid>
            <Grid item xs={4}>
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
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sourceTypes: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
};


export default injectIntl(OrgUnitInfosComponent);
