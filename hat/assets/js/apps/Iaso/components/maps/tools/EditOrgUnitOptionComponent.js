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
    buttonIconSvg: {
        ...commonStyles(theme).buttonIcon,
        fill: theme.palette.primary.main,
    },
});

class EditOrgUnitOptionComponent extends Component {
    render() {
        const {
            orgUnit,
            classes,
            editEnabled,
            toggleEditShape,
            onChangeLocation,
            addMarker,
            addShape,
            onDelete,
            onChange,
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
                        !editEnabled && orgUnit.geo_json
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
                        (editEnabled && orgUnit.geo_json)
                        && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    onChange();
                                    toggleEditShape();
                                }}
                                className={classes.buttonTopMargin}
                                color="primary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.shape.stopEdit" defaultMessage="Stop edit" />
                            </Button>
                        )
                    }

                    {
                        orgUnit.geo_json
                        && !editEnabled
                        && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                className={classes.button}
                                onClick={() => onDelete()}
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
                                    color="secondary"
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
                                    variant="outlined"
                                    onClick={() => addShape()}
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
    editEnabled: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    addMarker: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
};

export default withStyles(styles)(EditOrgUnitOptionComponent);
