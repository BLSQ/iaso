import React from 'react';
import Select from 'react-select';

import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';

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
    } = props;
    return (
        <Grid container spacing={0}>
            <Grid item xs={4}>
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
                <Select
                    id="org_unit_type"
                    simpleValue
                    name="org_unit_type"
                    isClearable
                    value={orgUnit.org_unit_type_id}
                    options={[
                        {
                            label: '1',
                            value: 1,
                        },
                        {
                            label: '2',
                            value: 2,
                        },
                        {
                            label: '3',
                            value: 3,
                        },
                        {
                            label: '4',
                            value: 4,
                        },
                    ]}
                    onChange={onChangeInfo}
                />
            </Grid>
        </Grid>
    );
}

OrgUnitInfosComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
};


export default withStyles(styles)(OrgUnitInfosComponent);
