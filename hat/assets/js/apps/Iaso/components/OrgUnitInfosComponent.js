import React from 'react';

import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';

import InputComponent from './forms/InputComponent';

import commonStyles from '../styles/common';


const styles = theme => ({
    ...commonStyles(theme),
    inputLabel: {
        backgroundColor: 'white',
        paddingLeft: 3,
        paddingRight: 3,
    },
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
