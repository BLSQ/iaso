import React from 'react';

import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';
import moment from 'moment';

import InputComponent from './forms/InputComponent';

import commonStyles from '../styles/common';


const styles = theme => ({
    ...commonStyles(theme),
});

function OrgUnitInfosComponent(props) {
    const {
        classes,
        orgUnit,
        onChangeInfo,
        orgUnitTypes,
    } = props;
    return (
        <Grid container spacing={4}>
            <Grid item xs={1} />
            <Grid item xs={5}>
                <InputComponent
                    keyValue="name"
                    onChange={onChangeInfo}
                    value={orgUnit.name}
                />
                <InputComponent
                    keyValue="short_name"
                    onChange={onChangeInfo}
                    value={orgUnit.short_name}
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
            </Grid>
            <Grid item xs={5}>
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
            <Grid item xs={1} />
        </Grid>
    );
}

OrgUnitInfosComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
};


export default withStyles(styles)(OrgUnitInfosComponent);
