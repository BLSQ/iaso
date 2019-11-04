import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    withStyles, Button, Box,
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
            editGeoJsonEnabled,
            editCatchmentEnabled,
            toggleEditShape,
            toggleEditCatchment,
            onChangeLocation,
            addMarker,
            addShape,
            onDeleteGeoJson,
            onDeleteCatchment,
            onChangeGeoJson,
            onChangeCatchment,
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
                    {
                        !editGeoJsonEnabled && !editCatchmentEnabled && orgUnit.geo_json
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => toggleEditShape()}
                                className={classes.buttonTopMargin}
                                color="primary"
                            >
                                <Edit className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.shape.edit" defaultMessage="Edit shape" />
                            </Button>
                        )
                    }
                    {
                        (editGeoJsonEnabled && orgUnit.geo_json)
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    onChangeGeoJson();
                                    toggleEditShape();
                                }}
                                className={classes.buttonTopMargin}
                                color="primary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.shape.stopEdit" defaultMessage="Stop edit shape" />
                            </Button>
                        )
                    }

                    {
                        orgUnit.geo_json
                        && !editGeoJsonEnabled
                        && !editCatchmentEnabled
                        && (
                            <Button
                                variant="outlined"
                                color="primary"
                                className={classes.button}
                                onClick={() => onDeleteGeoJson()}
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.shape.delete" defaultMessage="Delete shape" />
                            </Button>
                        )
                    }
                    {
                        !editGeoJsonEnabled && !editCatchmentEnabled && orgUnit.catchment
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => toggleEditCatchment()}
                                className={classes.buttonTopMargin}
                                color="secondary"
                            >
                                <Edit className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.catchment.edit" defaultMessage="Edit catchment" />
                            </Button>
                        )
                    }
                    {
                        (editCatchmentEnabled && orgUnit.catchment)
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    onChangeCatchment();
                                    toggleEditCatchment();
                                }}
                                className={classes.buttonTopMargin}
                                color="secondary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.catchment.stopEdit" defaultMessage="Stop edit catchment" />
                            </Button>
                        )
                    }
                    {
                        orgUnit.catchment
                        && !editGeoJsonEnabled
                        && !editCatchmentEnabled
                        && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                className={classes.button}
                                onClick={() => onDeleteCatchment()}
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.catchment.delete" defaultMessage="Delete catchment" />
                            </Button>
                        )
                    }
                    {
                        hasMarker
                        && (
                            <Fragment>
                                <InputComponent
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
                        !orgUnit.catchment
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => addShape('catchment')}
                                className={classes.buttonTopMargin}
                                color="secondary"
                            >
                                <ShapeSvg className={classes.buttonIconSvgSecondary} />
                                <FormattedMessage id="iaso.label.catchment.addShape" defaultMessage="Add catchment" />
                            </Button>
                        )
                    }
                    {
                        !orgUnit.geo_json
                        && !hasMarker
                        && (
                            <Fragment>
                                <Button
                                    variant="outlined"
                                    onClick={() => addShape('geo_json')}
                                    className={classes.buttonTopMargin}
                                    color="primary"
                                >
                                    <ShapeSvg className={classes.buttonIconSvg} />
                                    <FormattedMessage id="iaso.map.shape.addShape" defaultMessage="Add shape" />
                                </Button>
                                <Button
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
    editGeoJsonEnabled: PropTypes.bool.isRequired,
    editCatchmentEnabled: PropTypes.bool.isRequired,
    onChangeGeoJson: PropTypes.func.isRequired,
    onChangeCatchment: PropTypes.func.isRequired,
    onDeleteGeoJson: PropTypes.func.isRequired,
    onDeleteCatchment: PropTypes.func.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleEditCatchment: PropTypes.func.isRequired,
    addMarker: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
};

export default withStyles(styles)(EditOrgUnitOptionComponent);
