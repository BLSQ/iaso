import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer,
} from 'react-leaflet';
import 'react-leaflet-draw';
import { injectIntl } from 'react-intl';

import {
    Grid,
} from '@material-ui/core';

import L from 'leaflet';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import setDrawMessages from '../../../../utils/map/drawMapMessages';
import { customMarker, customZoomBar } from '../../utils/mapUtils';

import TileSwitch from './tools/TileSwitchComponent';
import InnerDrawer from '../nav/InnerDrawerComponent';
import EditOrgUnitOptionComponent from './tools/EditOrgUnitOptionComponent';
import FilterOrgunitOptionComponent from './tools/FilterOrgunitOptionComponent';
import MarkerComponent from './markers/MarkerComponent';

import { resetMapReducer } from '../../redux/mapReducer';

import 'leaflet-draw/dist/leaflet.draw.css';

const zoom = 5;
const padding = [10, 10];

const polygonDrawOpiton = {
    shapeOptions: { color: 'blue' },
};

let editToolbar;
let editHandler;
let drawControl;

const shapeOptions = () => ({
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            weight: 3,
        });
    },
});

const addMarker = () => {
    drawControl._toolbars.draw._modes.marker.handler.enable();
};
const editableFeatureGroup = new L.FeatureGroup();

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
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        const options = {
            position: 'topright',
            draw: {
                polyline: false,
                polygon: false,
                circle: false,
                marker: {
                    icon: customMarker,
                },
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

        drawControl = new L.Control.Draw(options);
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
        this.props.resetMapReducer();
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

    render() {
        const {
            orgUnit,
            currentTile,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
        } = this.props;
        const { editEnabled } = this.state;
        const hasMarker = Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    filtersOptionComponent={(
                        orgUnitTypes.length > 0 ? (
                            <FilterOrgunitOptionComponent
                                orgUnitTypes={orgUnitTypes}
                                currentOrgUnit={orgUnit}
                            />
                        ) : null
                    )}
                    editOptionComponent={(
                        <EditOrgUnitOptionComponent
                            orgUnit={orgUnit}
                            editEnabled={editEnabled}
                            onChange={() => this.onChange()}
                            onDelete={() => this.props.onChange(null)}
                            toggleEditShape={() => this.toggleEditShape()}
                            addMarker={() => addMarker()}
                            addShape={() => this.addShape()}
                            onChangeLocation={latLong => this.props.onChangeLocation(latLong)}
                            mapGeoJson={geoJson => this.mapGeoJson(geoJson)}
                        />
                    )}
                    settingsOptionComponent={(
                        <TileSwitch />
                    )}
                    title={formatMessage({
                        defaultMessage: 'Location informations',
                        id: 'iaso.orgUnits.infosLocation',
                    })}
                    editTitle={formatMessage({
                        defaultMessage: 'Edit location',
                        id: 'iaso.orgUnits.editLocation',
                    })}
                >
                    <Map
                        scrollWheelZoom={false}
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
                                <MarkerComponent
                                    item={orgUnit}
                                    draggable
                                    onDragend={newMarker => this.props.onChangeLocation(newMarker.getLatLng())}
                                />
                            )
                        }
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}
OrgUnitMapComponent.defaultProps = {
    orgUnitTypes: [],
};

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
});

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitMapComponent));
