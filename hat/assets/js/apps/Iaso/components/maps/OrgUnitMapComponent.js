import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer,
} from 'react-leaflet';
import 'react-leaflet-draw';
import { FormattedMessage, injectIntl } from 'react-intl';

import { withStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Edit from '@material-ui/icons/Edit';
import Add from '@material-ui/icons/Add';
import Check from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';

import L from 'leaflet';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import commonStyles from '../../styles/common';
import setDrawMessages from '../../../../utils/map/drawMapMessages';
import { MESSAGES } from '../../../../utils/map/mapUtils';

import TileSwitch from './TileSwitchComponent';

import 'leaflet-draw/dist/leaflet.draw.css';

const zoom = 5;
const padding = [10, 10];

const polygonDrawOpiton = {
    shapeOptions: { color: 'blue' },
};

const shapeOptions = () => ({
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            weight: 3,
        });
    },
});

const styles = theme => ({
    ...commonStyles(theme),
    mapContainer: {
        height: '70vh',
        marginBottom: theme.spacing(2),
    },
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
});

const editableFeatureGroup = new L.FeatureGroup();
let editHandler;

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        const leafletGeoJSON = L.geoJson(props.orgUnit.geo_json, shapeOptions);
        this.state = {
            leafletGeoJSON,
            editEnabled: false,
        };
    }

    componentDidMount() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        const zoomBar = L.control.zoombar({
            zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
            zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
            fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
            fitToBounds: () => this.fitToBounds(),
            position: 'topleft',
        });
        zoomBar.addTo(this.map.leafletElement);
        const options = {
            position: 'topright',
            draw: {
                polyline: false,
                polygon: false,
                circle: false,
                marker: false,
                circlemarker: false,
                featureGroup: editableFeatureGroup,
                rectangle: false,
            },
            edit: {
                edit: false,
                featureGroup: editableFeatureGroup,
                remove: false,
            },
        };
        setDrawMessages(formatMessage);

        const drawControl = new L.Control.Draw(options);
        this.map.leafletElement.addControl(drawControl);
        this.map.leafletElement.addLayer(editableFeatureGroup);
        this.map.leafletElement.on('draw:created', (e) => {
            e.layer.addTo(editableFeatureGroup);
            this.onChange();
        });
        this.updateShape(this.state.leafletGeoJSON, true);
    }


    componentWillReceiveProps(newProps) {
        if (!isEqual(newProps.orgUnit.geo_json && this.props.orgUnit.geo_json)) {
            this.mapGeoJson(newProps.orgUnit.geo_json);
        }
    }

    onChange() {
        const { onChange } = this.props;

        if (!editableFeatureGroup || !onChange) {
            return;
        }
        const geojsonData = editableFeatureGroup.toGeoJSON();
        onChange(geojsonData);
    }

    mapGeoJson(geoJson) {
        const leafletGeoJSON = geoJson ? L.geoJson(geoJson, shapeOptions) : null;
        this.setState({
            leafletGeoJSON,
        });
        this.updateShape(leafletGeoJSON, false);
    }

    updateShape(leafletGeoJSON = this.state.leafletGeoJSON, fitToBounds = false) {
        editableFeatureGroup.clearLayers();
        if (leafletGeoJSON) {
            leafletGeoJSON.eachLayer((layer) => {
                layer.addTo(editableFeatureGroup);
            });
        }

        const editToolbar = new L.EditToolbar({
            featureGroup: editableFeatureGroup,
        });
        editHandler = editToolbar.getModeHandlers()[0].handler;
        editHandler._map = this.map.leafletElement;
        if (fitToBounds) {
            this.fitToBounds(leafletGeoJSON);
        }
    }

    fitToBounds(leafletGeoJSON = this.state.leafletGeoJSON) {
        console.log('fitToBounds');
        const { currentTile } = this.props;
        if (leafletGeoJSON) {
            this.map.leafletElement.fitBounds(leafletGeoJSON.getBounds(), { maxZoom: currentTile.maxZoom, padding });
        }
    }

    toggleEdit() {
        const { editEnabled } = this.state;

        if (!editEnabled) {
            editHandler.enable();
        } else {
            editHandler.disable();
        }
        this.setState({
            editEnabled: !editEnabled,
        });
    }

    addShape() {
        new L.Draw.Polygon(this.map.leafletElement, polygonDrawOpiton).enable();
    }

    render() {
        const {
            classes, orgUnit, currentTile,
        } = this.props;
        const { leafletGeoJSON, editEnabled } = this.state;
        return (
            <Grid container spacing={4}>
                <Grid item xs={10} className={classes.mapContainer}>
                    <Map
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        ref={(ref) => {
                            this.map = ref;
                        }}
                        center={[0, 0]}
                        boundsOptions={{ padding }}
                        zoom={zoom}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution={currentTile.attribution ? currentTile.attribution : ''}
                            url={currentTile.url}
                        />
                    </Map>
                </Grid>
                <Grid item xs={2}>
                    <TileSwitch />
                    {
                        !editEnabled
                        && orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => this.toggleEdit()}
                                className={classes.button}
                                color="primary"
                            >
                                <Edit className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />
                            </Button>
                        )
                    }
                    {
                        editEnabled
                        && orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => {
                                    this.toggleEdit();
                                    this.onChange();
                                }}
                                className={classes.button}
                                color="secondary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.validate" defaultMessage="Validate" />
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
                                onClick={() => this.props.onChange(null)}
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />
                            </Button>
                        )
                    }
                    {
                        !orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => this.addShape()}
                                className={classes.button}
                                color="primary"
                            >
                                <Add className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.shape.add" defaultMessage="Add shape" />
                            </Button>
                        )
                    }
                </Grid>
            </Grid>
        );
    }
}

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});


export default withStyles(styles)(connect(MapStateToProps)(injectIntl(OrgUnitMapComponent)));
