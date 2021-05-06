import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { withStyles, Button, Box, Typography } from '@material-ui/core';

import AddLocation from '@material-ui/icons/AddLocation';
import DeleteIcon from '@material-ui/icons/Delete';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    buttonTopMargin: {
        width: '100%',
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
});

class EditOrgUnitOptionComponent extends Component {
    render() {
        const {
            orgUnit,
            classes,
            editCatchmentEnabled,
            onChangeLocation,
            addMarker,
        } = this.props;
        const hasMarker =
            Boolean(orgUnit.latitude !== null) &&
            Boolean(orgUnit.longitude !== null);
        return (
            <Box
                display="flex"
                flexWrap="wrap"
                className={classes.innerDrawerContent}
                flexDirection="column"
            >
                <Box
                    component="div"
                    display="flex"
                    flexWrap="wrap"
                    flexDirection="column"
                >
                    <Box px={0} component="div" className={classes.marginTop}>
                        <Typography variant="subtitle1">
                            <FormattedMessage {...MESSAGES.location} />
                        </Typography>
                    </Box>
                    {hasMarker && (
                        <>
                            <InputComponent
                                disabled={editCatchmentEnabled}
                                keyValue="latitude"
                                onChange={(key, latitude) => {
                                    if (latitude) {
                                        onChangeLocation({
                                            lat: parseFloat(latitude),
                                            lng: orgUnit.longitude,
                                        });
                                    }
                                }}
                                value={orgUnit.latitude}
                                type="number"
                                label={MESSAGES.latitude}
                            />
                            <InputComponent
                                disabled={editCatchmentEnabled}
                                keyValue="longitude"
                                onChange={(key, longitude) =>
                                    onChangeLocation({
                                        lat: orgUnit.latitude,
                                        lng: parseFloat(longitude),
                                    })
                                }
                                value={orgUnit.longitude}
                                type="number"
                                label={MESSAGES.longitude}
                            />
                            {/* read-only altitude field until edition is implemented */}
                            <InputComponent
                                disabled
                                keyValue="altitude"
                                value={
                                    orgUnit.altitude !== null
                                        ? orgUnit.altitude
                                        : 0
                                }
                                type="number"
                                label={MESSAGES.altitude}
                            />
                            <Button
                                disabled={editCatchmentEnabled}
                                variant="outlined"
                                color="primary"
                                className={classes.buttonTopMargin}
                                onClick={() =>
                                    onChangeLocation({ lat: null, lng: null })
                                }
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage {...MESSAGES.deleteMarker} />
                            </Button>
                        </>
                    )}
                    {!orgUnit.geo_json && !hasMarker && (
                        <>
                            <Button
                                disabled={editCatchmentEnabled}
                                variant="outlined"
                                onClick={() => addMarker()}
                                className={classes.button}
                                color="primary"
                            >
                                <AddLocation className={classes.buttonIcon} />
                                <FormattedMessage {...MESSAGES.addLocation} />
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        );
    }
}

EditOrgUnitOptionComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    editLocationEnabled: PropTypes.bool.isRequired,
    editCatchmentEnabled: PropTypes.bool.isRequired,
    onChangeShape: PropTypes.func.isRequired,
    onDeleteShape: PropTypes.func.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    addMarker: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
};

export default withStyles(styles)(EditOrgUnitOptionComponent);
