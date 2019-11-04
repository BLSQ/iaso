import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import {
    withStyles, Button,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

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
        toggleEditCatchment,
        orgUnitLocationModified,
        classes,
        editGeoJsonEnabled,
        editCatchmentEnabled,
        mapGeoJson,
        mapCatchment,
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
                    if (editGeoJsonEnabled) {
                        toggleEditShape();
                    }
                    if (editCatchmentEnabled) {
                        toggleEditCatchment();
                    }
                    mapGeoJson(orgUnit.geo_json);
                    mapCatchment(orgUnit.catchment);
                    resetOrgUnit();
                }}
            >
                <FormattedMessage id="iaso.label.cancel" defaultMessage="Cancel" />
            </Button>
            <Button
                disabled={!orgUnitLocationModified || editGeoJsonEnabled || editCatchmentEnabled}
                variant="contained"
                className={classes.button}
                color="primary"
                onClick={() => saveOrgUnit()}
            >
                <FormattedMessage id="iaso.label.save" defaultMessage="Save" />
            </Button>
        </Fragment>
    );
}

OrgunitOptionSaveComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    editGeoJsonEnabled: PropTypes.bool.isRequired,
    editCatchmentEnabled: PropTypes.bool.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleEditCatchment: PropTypes.func.isRequired,
    mapGeoJson: PropTypes.func.isRequired,
    mapCatchment: PropTypes.func.isRequired,
    resetOrgUnit: PropTypes.func.isRequired,
    orgUnitLocationModified: PropTypes.bool.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
};

export default withStyles(styles)(OrgunitOptionSaveComponent);
