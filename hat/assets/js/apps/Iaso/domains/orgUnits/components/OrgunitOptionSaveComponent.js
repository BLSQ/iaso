import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import { withStyles, Button } from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
});

function OrgunitOptionSaveComponent(props) {
    const {
        toggleEditShape,
        orgUnitLocationModified,
        classes,
        editLocationEnabled,
        editCatchmentEnabled,
        mapShape,
        orgUnit,
        resetOrgUnit,
        saveOrgUnit,
    } = props;
    return (
        <Fragment>
            <Button
                className={classes.button}
                disabled={!orgUnitLocationModified}
                variant="contained"
                onClick={() => {
                    if (editLocationEnabled) {
                        toggleEditShape('location');
                    }
                    if (editCatchmentEnabled) {
                        toggleEditShape('catchment');
                    }
                    mapShape(orgUnit.geo_json, 'location');
                    mapShape(orgUnit.catchment, 'catchment');
                    resetOrgUnit();
                }}
            >
                <FormattedMessage {...MESSAGES.cancel} />
            </Button>
            <Button
                disabled={
                    !orgUnitLocationModified ||
                    editLocationEnabled ||
                    editCatchmentEnabled
                }
                variant="contained"
                className={classes.button}
                color="primary"
                onClick={() => saveOrgUnit()}
            >
                <FormattedMessage {...MESSAGES.save} />
            </Button>
        </Fragment>
    );
}

OrgunitOptionSaveComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    editLocationEnabled: PropTypes.bool.isRequired,
    editCatchmentEnabled: PropTypes.bool.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    mapShape: PropTypes.func.isRequired,
    resetOrgUnit: PropTypes.func.isRequired,
    orgUnitLocationModified: PropTypes.bool.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
};

export default withStyles(styles)(OrgunitOptionSaveComponent);
