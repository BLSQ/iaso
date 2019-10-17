import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer, GeoJSON,
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
import { customMarker, customZoomBar, clusterColorMarker } from '../../utils/mapUtils';

import TileSwitch from './tools/TileSwitchComponent';
import InnerDrawer from '../nav/InnerDrawerComponent';
import EditOrgUnitOptionComponent from './tools/EditOrgUnitOptionComponent';
import OrgunitOptionSaveComponent from './tools/OrgunitOptionSaveComponent';
import OrgUnitTypeChipsFilterComponent from '../filters/chips/OrgUnitTypeChipsFilterComponent';
import FormsChipsFilterComponent from '../filters/chips/FormsChipsFilterComponent';
import SourcesChipsFilterComponent from '../filters/chips/SourcesChipsFilterComponent';
import MarkerComponent from './markers/MarkerComponent';
import MarkersListComponent from './markers/MarkersListComponent';
import OrgUnitPopupComponent from './popups/OrgUnitPopupComponent';
import InstancePopupComponent from './popups/InstancePopupComponent';

import { resetMapReducer } from '../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../../redux/orgUnitsReducer';
import { setCurrentInstance } from '../../redux/instancesReducer';

import { fetchOrgUnitDetail, fetchInstanceDetail } from '../../utils/requests';

import 'leaflet-draw/dist/leaflet.draw.css';

const zoom = 5;
const padding = [75, 75];

const polygonDrawOpiton = {
    shapeOptions: {
        color: 'blue',
        className: 'primary no-pointer-event',
    },
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
let editableFeatureGroup = new L.FeatureGroup();

const mapOrgUnitByLocation = (orgUnits) => {
    const mappedOrgunits = [];
    orgUnits.forEach((ot) => {
        const otCopy = {
            ...ot,
            orgUnits: {
                shapes: [],
                locations: [],
            },
        };
        ot.orgUnits.forEach((o) => {
            if (o.latitude && o.longitude) {
                otCopy.orgUnits.locations.push(o);
            }
            if (o.geo_json) {
                otCopy.orgUnits.shapes.push(o);
            }
        });
        mappedOrgunits.push(otCopy);
    });
    return mappedOrgunits;
};

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        const leafletGeoJSON = L.geoJson(props.orgUnit.geo_json, shapeOptions);
        this.state = {
            leafletGeoJSON,
            editEnabled: false,
            currentOption: 'filters',
        };
    }

    componentDidMount() {
        const {
            intl: {
                formatMessage,
            },
            setOrgUnitLocationModified,
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
        this.map.leafletElement.createPane('custom-shape-pane');
        this.map.leafletElement.addControl(drawControl);
        this.map.leafletElement.addLayer(editableFeatureGroup);
        this.map.leafletElement.on('draw:created', (e) => {
            e.layer.addTo(editableFeatureGroup);
            if (e.layerType === 'polygon') {
                setOrgUnitLocationModified();
                this.onChange();
            }
            if (e.layerType === 'marker') {
                this.props.onChangeLocation(e.layer.getLatLng());
                this.map.leafletElement.removeLayer(e.layer);
            }
        });
        this.map.leafletElement.on('draw:editvertex', () => {
            setOrgUnitLocationModified();
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
        editableFeatureGroup = new L.FeatureGroup();
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

    setCurrentOption(currentOption) {
        this.setState({
            currentOption,
        });
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
                const tempLayer = layer;
                tempLayer.options.className = 'primary no-pointer-event';
                tempLayer.options.pane = 'custom-shape-pane';
                tempLayer.addTo(editableFeatureGroup);
            });
        }
        if (fitToBounds) {
            this.fitToBounds(leafletGeoJSON);
        }
    }

    fitToBounds(leafletGeoJSON = this.state.leafletGeoJSON) {
        const { currentTile, orgUnit } = this.props;
        if (orgUnit.geo_json) {
            this.map.leafletElement.fitBounds(leafletGeoJSON.getBounds(), { maxZoom: currentTile.maxZoom, padding, animate: false });
        }
        if (orgUnit.latitude && orgUnit.longitude) {
            const latlng = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
            const markerBounds = L.latLngBounds(latlng);
            this.map.leafletElement.fitBounds(markerBounds, { maxZoom: 10, padding, animate: false });
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

    fetchSubOrgUnitDetail(orgUnit) {
        const {
            dispatch,
        } = this.props;
        this.props.setCurrentSubOrgUnit(null);
        fetchOrgUnitDetail(dispatch, orgUnit.id).then(i => this.props.setCurrentSubOrgUnit(i));
    }

    fetchInstanceDetail(instance) {
        const {
            dispatch,
        } = this.props;
        this.props.setCurrentInstance(null);
        fetchInstanceDetail(dispatch, instance.id).then(i => this.props.setCurrentInstance(i));
    }

    useOrgUnitLocation(newOrgUnit) {
        const { onChange, onChangeLocation, setOrgUnitLocationModified } = this.props;
        if (newOrgUnit.latitude && newOrgUnit.longitude) {
            onChangeLocation({
                lat: newOrgUnit.latitude,
                lng: newOrgUnit.longitude,
            });
        } else if (newOrgUnit.has_geo_json) {
            setOrgUnitLocationModified();
            onChange(newOrgUnit.geo_json);
        }
    }

    render() {
        const {
            orgUnit,
            currentTile,
            sourcesSelected,
            formsSelected,
            orgUnitTypesSelected,
            saveOrgUnit,
            resetOrgUnit,
            orgUnitLocationModified,
            setOrgUnitLocationModified,
        } = this.props;
        const { editEnabled, currentOption } = this.state;
        const hasMarker = Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        const mappedOrgUnitTypesSelected = mapOrgUnitByLocation(orgUnitTypesSelected);
        const mappedSourcesSelected = mapOrgUnitByLocation(sourcesSelected);
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    setCurrentOption={option => this.setCurrentOption(option)}
                    settingsDisabled={editEnabled}
                    filtersDisabled={editEnabled}
                    footerComponent={(
                        <OrgunitOptionSaveComponent
                            orgUnit={orgUnit}
                            editEnabled={editEnabled}
                            toggleEditShape={() => this.toggleEditShape()}
                            mapGeoJson={geoJson => this.mapGeoJson(geoJson)}
                            resetOrgUnit={resetOrgUnit}
                            orgUnitLocationModified={orgUnitLocationModified}
                            saveOrgUnit={saveOrgUnit}
                        />
                    )}
                    filtersOptionComponent={(
                        <Fragment>
                            <SourcesChipsFilterComponent />
                            <OrgUnitTypeChipsFilterComponent />
                            <FormsChipsFilterComponent />
                        </Fragment>
                    )}
                    editOptionComponent={(

                        <EditOrgUnitOptionComponent
                            orgUnit={orgUnit}
                            editEnabled={editEnabled}
                            onChange={() => {
                                this.onChange();
                            }
                            }
                            onDelete={() => {
                                setOrgUnitLocationModified();
                                this.props.onChange(null);
                            }}
                            toggleEditShape={() => this.toggleEditShape()}
                            addMarker={() => addMarker()}
                            addShape={() => this.addShape()}
                            onChangeLocation={latLong => this.props.onChangeLocation(latLong)}
                        />
                    )}
                    settingsOptionComponent={(
                        <TileSwitch />
                    )}
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
                        {!editEnabled
                            && mappedOrgUnitTypesSelected.map(ot => (
                                <Fragment key={ot.id}>
                                    <MarkersListComponent
                                        items={ot.orgUnits.locations}
                                        onMarkerClick={o => this.fetchSubOrgUnitDetail(o)}
                                        PopupComponent={OrgUnitPopupComponent}
                                        popupProps={{
                                            displayUseLocation: true,
                                            useLocation: selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit),
                                        }}
                                        customMarker={clusterColorMarker(ot.color, 'white-pentagon.svg')}
                                    />
                                    {
                                        ot.orgUnits.shapes.map(o => (
                                            <GeoJSON
                                                key={o.id}
                                                data={o.geo_json}
                                                onClick={() => this.fetchSubOrgUnitDetail(o)}
                                                style={() => (
                                                    { color: ot.color }
                                                )}
                                            >
                                                <OrgUnitPopupComponent
                                                    displayUseLocation
                                                    useLocation={selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit)}
                                                />
                                            </GeoJSON>
                                        ))
                                    }
                                </Fragment>
                            ))
                        }
                        {!editEnabled
                            && formsSelected.map(f => (
                                <MarkersListComponent
                                    key={f.id}
                                    items={f.instances}
                                    onMarkerClick={i => this.fetchInstanceDetail(i)}
                                    PopupComponent={InstancePopupComponent}
                                    popupProps={{
                                        displayUseLocation: true,
                                        useLocation: selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit),
                                    }}
                                    customMarker={clusterColorMarker(f.color, 'white-form.svg')}
                                />
                            ))
                        }
                        {mappedSourcesSelected.map(s => (
                            <Fragment key={s.id}>
                                <MarkersListComponent
                                    items={s.orgUnits.locations}
                                    onMarkerClick={o => this.fetchSubOrgUnitDetail(o)}
                                    PopupComponent={OrgUnitPopupComponent}
                                    customMarker={clusterColorMarker(s.color)}
                                />
                                {
                                    s.orgUnits.shapes.map(o => (
                                        <GeoJSON
                                            key={o.id}
                                            data={o.geo_json}
                                            onClick={() => this.fetchSubOrgUnitDetail(o)}
                                            style={() => (
                                                { color: s.color }
                                            )}
                                        >
                                            <OrgUnitPopupComponent
                                                displayUseLocation
                                                useLocation={selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit)}
                                            />
                                        </GeoJSON>
                                    ))
                                }
                            </Fragment>
                        ))}
                        {
                            hasMarker
                            && (
                                <MarkerComponent
                                    item={orgUnit}
                                    draggable={currentOption === 'edit'}
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

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    orgUnitTypesSelected: PropTypes.array.isRequired,
    formsSelected: PropTypes.array.isRequired,
    setCurrentSubOrgUnit: PropTypes.func.isRequired,
    setCurrentInstance: PropTypes.func.isRequired,
    sourcesSelected: PropTypes.array.isRequired,
    resetOrgUnit: PropTypes.func.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
    setOrgUnitLocationModified: PropTypes.func.isRequired,
    orgUnitLocationModified: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    formsSelected: state.orgUnits.currentFormsSelected,
    currentTile: state.map.currentTile,
    orgUnitTypesSelected: state.orgUnits.currentSubOrgUnitsTypesSelected,
    sourcesSelected: state.orgUnits.currentSourcesSelected,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
    setCurrentSubOrgUnit: o => dispatch(setCurrentSubOrgUnit(o)),
    setCurrentInstance: i => dispatch(setCurrentInstance(i)),
});

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitMapComponent));
