import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import {
    withStyles, Button,
} from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import AddLocation from '@material-ui/icons/AddLocation';
import FormatShapes from '@material-ui/icons/FormatShapes';
import Check from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
import Cancel from '@material-ui/icons/Cancel';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

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

        const hasMarker = Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
        return (
            <Fragment>
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
                            <FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />
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
                            <FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />
                        </Button>
                    )
                }
                {
                    hasMarker
                    && (
                        <Button
                            variant="contained"
                            color="secondary"
                            className={classes.button}
                            onClick={() => onChangeLocation({ lat: null, lng: null })}
                        >
                            <DeleteIcon className={classes.buttonIcon} />
                            <FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />
                        </Button>
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
                                <FormatShapes className={classes.buttonIcon} />
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
            </Fragment>
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
