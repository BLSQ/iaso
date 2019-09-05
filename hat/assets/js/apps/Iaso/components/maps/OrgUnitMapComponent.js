import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer, Marker,
} from 'react-leaflet';
import 'react-leaflet-draw';
import { FormattedMessage, injectIntl } from 'react-intl';

import { withStyles, Button, Grid } from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import AddLocation from '@material-ui/icons/AddLocation';
import FormatShapes from '@material-ui/icons/FormatShapes';
import Check from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
import Cancel from '@material-ui/icons/Cancel';

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

let editToolbar;

const shapeOptions = () => ({
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            weight: 3,
        });
    },
});

const styles = theme => ({
    ...commonStyles(theme),
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
            if (e.layerType === 'polygon') {
                this.onChange();
            }
            if (e.layerType === 'marker') {
                this.props.onChangeLocation(e.layer.getLatLng());
                this.map.leafletElement.removeLayer(e.layer);
            }
        });

        editToolbar = new L.EditToolbar({
            featureGroup: editableFeatureGroup,
        });
        editHandler = editToolbar.getModeHandlers()[0].handler;
        editHandler._map = this.map.leafletElement;
        if (this.props.orgUnit.geo_json) {
            this.updateShape(this.state.leafletGeoJSON, true);
        }
        if (this.props.orgUnit.latitude && this.props.orgUnit.longitude) {
            this.fitToBounds();
        }
    }


    componentWillReceiveProps(newProps) {
        if (!isEqual(newProps.orgUnit.geo_json, this.props.orgUnit.geo_json)) {
            this.mapGeoJson(newProps.orgUnit.geo_json);
        }
    }

    componentWillUnmount() {
        if (this.state.editEnabled) {
            this.toggleEditShape();
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
        if (fitToBounds) {
            this.fitToBounds(leafletGeoJSON);
        }
    }

    fitToBounds(leafletGeoJSON = this.state.leafletGeoJSON) {
        const { currentTile, orgUnit } = this.props;
        if (orgUnit.geo_json) {
            this.map.leafletElement.fitBounds(leafletGeoJSON.getBounds(), { maxZoom: currentTile.maxZoom, padding });
        }
        if (orgUnit.latitude && orgUnit.longitude) {
            const latlng = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
            const markerBounds = L.latLngBounds(latlng);
            this.map.leafletElement.fitBounds(markerBounds, { maxZoom: 10, padding });
        }
    }

    toggleEditShape() {
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

    addMarker() {
        new L.Draw.Marker(this.map.leafletElement).enable();
    }

    render() {
        const {
            classes, orgUnit, currentTile,
        } = this.props;
        const { editEnabled } = this.state;
        const hasMarker = Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
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
                        {
                            hasMarker
                            && (
                                <Marker
                                    position={[orgUnit.latitude, orgUnit.longitude]}
                                    draggable
                                    onDragend={e => this.props.onChangeLocation(e.target.getLatLng())}
                                />
                            )
                        }
                    </Map>
                </Grid>
                <Grid item xs={2}>
                    <TileSwitch />
                    {
                        !editEnabled && orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => this.toggleEditShape()}
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
                                    this.toggleEditShape();
                                    this.onChange();
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
                                    this.toggleEditShape();
                                    this.mapGeoJson(orgUnit.geo_json);
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
                                onClick={() => this.props.onChange(null)}
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
                                onClick={() => this.props.onChangeLocation({ lat: null, lng: null })}
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
                                    onClick={() => this.addShape()}
                                    className={classes.button}
                                    color="primary"
                                >
                                    <FormatShapes className={classes.buttonIcon} />
                                    <FormattedMessage id="iaso.map.shape.addShape" defaultMessage="Add shape" />
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => this.addMarker()}
                                    className={classes.button}
                                    color="primary"
                                >
                                    <AddLocation className={classes.buttonIcon} />
                                    <FormattedMessage id="iaso.map.shape.addLocation" defaultMessage="Add a location" />
                                </Button>
                            </Fragment>
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
    onChangeLocation: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});


export default withStyles(styles)(connect(MapStateToProps)(injectIntl(OrgUnitMapComponent)));
