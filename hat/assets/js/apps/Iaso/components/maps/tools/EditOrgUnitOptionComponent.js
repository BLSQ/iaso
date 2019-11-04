import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    withStyles, Button, Box, Typography,
} from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import AddLocation from '@material-ui/icons/AddLocation';
import DeleteIcon from '@material-ui/icons/Delete';
import Check from '@material-ui/icons/Check';


import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

import ShapeSvg from '../../svg/ShapeSvgComponent';
import InputComponent from '../../forms/InputComponent';

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
            editLocationEnabled,
            editCatchmentEnabled,
            toggleEditShape,
            onChangeLocation,
            addMarker,
            addShape,
            onDeleteShape,
            onChangeShape,
        } = this.props;
        const hasMarker = Boolean(orgUnit.latitude !== null) && Boolean(orgUnit.longitude !== null);
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
                    <Box
                        px={0}
                        component="div"
                    >
                        <Typography variant="subtitle1">
                            <FormattedMessage id="iaso.map.catchment" defaultMessage="Catchment" />
                        </Typography>
                    </Box>
                    {
                        !editCatchmentEnabled && orgUnit.catchment
                        && (
                            <Button
                                disabled={editLocationEnabled}
                                variant="outlined"
                                onClick={() => toggleEditShape('catchment')}
                                className={classes.buttonTopMargin}
                                color="secondary"
                            >
                                <Edit className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />
                            </Button>
                        )
                    }
                    {
                        (editCatchmentEnabled && orgUnit.catchment)
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    onChangeShape('catchment');
                                    toggleEditShape('catchment');
                                }}
                                className={classes.buttonTopMargin}
                                color="secondary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.stopEdit" defaultMessage="Stop edit" />
                            </Button>
                        )
                    }
                    {
                        orgUnit.catchment
                        && !editCatchmentEnabled
                        && (
                            <Button
                                disabled={editLocationEnabled}
                                variant="outlined"
                                color="secondary"
                                className={classes.button}
                                onClick={() => onDeleteShape('catchment')}
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />
                            </Button>
                        )
                    }
                    {
                        !orgUnit.catchment
                        && (
                            <Button
                                disabled={editLocationEnabled}
                                variant="outlined"
                                onClick={() => addShape('catchment')}
                                className={classes.buttonTopMargin}
                                color="secondary"
                            >
                                <ShapeSvg className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.add" defaultMessage="Add" />
                            </Button>
                        )
                    }
                    <Box
                        px={0}
                        component="div"
                        className={classes.marginTop}
                    >
                        <Typography variant="subtitle1">
                            <FormattedMessage id="iaso.map.location" defaultMessage="Location" />
                        </Typography>
                    </Box>
                    {
                        !editLocationEnabled && orgUnit.geo_json
                        && (
                            <Button
                                disabled={editCatchmentEnabled}
                                variant="outlined"
                                onClick={() => toggleEditShape('location')}
                                className={classes.buttonTopMargin}
                                color="primary"
                            >
                                <Edit className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.shape.edit" defaultMessage="Edit shape" />
                            </Button>
                        )
                    }
                    {
                        (editLocationEnabled && orgUnit.geo_json)
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    onChangeShape('location');
                                    toggleEditShape('location');
                                }}
                                className={classes.buttonTopMargin}
                                color="primary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.stopEdit" defaultMessage="Stop edit" />
                            </Button>
                        )
                    }

                    {
                        orgUnit.geo_json
                        && !editLocationEnabled
                        && (
                            <Button
                                disabled={editCatchmentEnabled}
                                variant="outlined"
                                color="primary"
                                className={classes.button}
                                onClick={() => onDeleteShape('location')}
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.shape.delete" defaultMessage="Delete shape" />
                            </Button>
                        )
                    }
                    {
                        hasMarker
                        && (
                            <Fragment>
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
                                    label={{
                                        defaultMessage: 'Latitude',
                                        id: 'iaso.label.latitude',
                                    }}
                                />
                                <InputComponent
                                    disabled={editCatchmentEnabled}
                                    keyValue="longitude"
                                    onChange={(key, longitude) => onChangeLocation({
                                        lat: orgUnit.latitude,
                                        lng: parseFloat(longitude),
                                    })}
                                    value={orgUnit.longitude}
                                    type="number"
                                    label={{
                                        defaultMessage: 'Longitude',
                                        id: 'iaso.label.longitude',
                                    }}
                                />
                                <Button
                                    disabled={editCatchmentEnabled}
                                    variant="outlined"
                                    color="primary"
                                    className={classes.buttonTopMargin}
                                    onClick={() => onChangeLocation({ lat: null, lng: null })}
                                >
                                    <DeleteIcon className={classes.buttonIcon} />
                                    <FormattedMessage id="iaso.map.marker.delete" defaultMessage="Delete marker" />
                                </Button>
                            </Fragment>
                        )
                    }
                    {
                        !orgUnit.geo_json
                        && !hasMarker
                        && (
                            <Fragment>
                                <Button
                                    disabled={editCatchmentEnabled}
                                    variant="outlined"
                                    onClick={() => addShape('geo_json')}
                                    className={classes.buttonTopMargin}
                                    color="primary"
                                >
                                    <ShapeSvg className={classes.buttonIcon} />
                                    <FormattedMessage id="iaso.map.shape.addShape" defaultMessage="Add shape" />
                                </Button>
                                <Button
                                    disabled={editCatchmentEnabled}
                                    variant="outlined"
                                    onClick={() => addMarker()}
                                    className={classes.button}
                                    color="primary"
                                >
                                    <AddLocation className={classes.buttonIcon} />
                                    <FormattedMessage id="iaso.map.shape.addLocation" defaultMessage="Add a location" />
                                </Button>
                            </Fragment>
                        )
                    }
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
