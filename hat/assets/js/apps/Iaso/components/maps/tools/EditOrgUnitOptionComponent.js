import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import {
    withStyles, Button, Box, Divider,
} from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import AddLocation from '@material-ui/icons/AddLocation';
import Check from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
import Cancel from '@material-ui/icons/Cancel';


import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';
import shapeSvg from '../../../images/white-shape.svg';
import InputComponent from '../../forms/InputComponent';

const styles = theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
});

class EditOrgUnitOptionComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

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
            mapGeoJson,
        } = this.props;
        const hasMarker = Boolean(orgUnit.latitude !== null) && Boolean(orgUnit.longitude !== null);
        return (
            <Box
                px={2}
                component="div"
                className={classes.marginTop}
            >
                {
                    !editEnabled && orgUnit.geo_json
                    && (
                        <Button
                            variant="contained"
                            onClick={() => toggleEditShape()}
                            className={classes.button}
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
                            variant="contained"
                            onClick={() => {
                                toggleEditShape();
                                onChange();
                            }}
                            className={classes.button}
                            color="primary"
                        >
                            <Check className={classes.buttonIcon} />
                            <FormattedMessage id="iaso.label.validate" defaultMessage="Validate" />
                        </Button>
                    )
                }
                {
                    (editEnabled && orgUnit.geo_json)
                    && (
                        <Button
                            variant="contained"
                            className={classes.button}
                            onClick={() => {
                                toggleEditShape();
                                mapGeoJson(orgUnit.geo_json);
                            }}
                        >
                            <Cancel className={classes.buttonIcon} fontSize="small" />
                            <FormattedMessage id="iaso.label.cancel" defaultMessage="Cancel" />
                        </Button>
                    )
                }

                {
                    orgUnit.geo_json
                    && !editEnabled
                    && (
                        <Button
                            variant="contained"
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
                            <Divider className={classes.marginY} />
                            <Button
                                variant="contained"
                                color="secondary"
                                className={classes.button}
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
                                variant="contained"
                                onClick={() => addShape()}
                                className={classes.button}
                                color="primary"
                            >
                                <img src={shapeSvg} className={classes.buttonIcon} alt="" />
                                <FormattedMessage id="iaso.map.shape.addShape" defaultMessage="Add shape" />
                            </Button>
                            <Button
                                variant="contained"
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
    mapGeoJson: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(EditOrgUnitOptionComponent),
);
