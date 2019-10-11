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
        orgUnitLocationModified,
        classes,
        editEnabled,
        mapGeoJson,
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
                    if (editEnabled) {
                        toggleEditShape();
                    }
                    mapGeoJson(orgUnit.geo_json);
                    resetOrgUnit();
                }}
            >
                <FormattedMessage id="iaso.label.cancel" defaultMessage="Cancel" />
            </Button>
            <Button
                disabled={!orgUnitLocationModified || editEnabled}
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
    editEnabled: PropTypes.bool.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    mapGeoJson: PropTypes.func.isRequired,
    resetOrgUnit: PropTypes.func.isRequired,
    orgUnitLocationModified: PropTypes.bool.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
};

export default withStyles(styles)(OrgunitOptionSaveComponent);
