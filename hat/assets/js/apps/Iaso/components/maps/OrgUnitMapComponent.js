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
import { customMarker, customZoomBar, colorMarker } from '../../utils/mapUtils';

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

import theme from '../../utils/theme';

import 'leaflet-draw/dist/leaflet.draw.css';

const zoom = 5;
const padding = [75, 75];

const polygonDrawOpiton = (customClass = 'primary') => {
    return ({
        shapeOptions: {
            color: theme.palette[customClass].main,
            className: `${customClass} no-pointer-event`,
        },
    });
};

let editToolbar;
let editGeoJsonHandler;
let drawGeoJsonControl;
let editCatchmentHandler;
let editableGeoJsonFeatureGroup = new L.FeatureGroup();
let editableCatchmentFeatureGroup = new L.FeatureGroup();

const shapeOptions = () => ({
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            weight: 3,
        });
    },
});

const addMarker = () => {
    drawGeoJsonControl._toolbars.draw._modes.marker.handler.enable();
};

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

const addDrawControl = (map, group) => {
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
            featureGroup: group,
            rectangle: false,
        },
        edit: {
            edit: false,
            featureGroup: group,
            remove: false,
        },
    };

    const drawControl = new L.Control.Draw(options);
    map.addControl(drawControl);
    map.addLayer(group);
    editToolbar = new L.EditToolbar({
        featureGroup: group,
    });
    const editHandler = editToolbar.getModeHandlers()[0].handler;
    editHandler._map = map;
    return {
        editHandler,
        drawControl,
    };
};

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        const leafletGeoJSON = L.geoJson(props.orgUnit.geo_json, shapeOptions);
        const catchmentGeoJSON = L.geoJson(props.orgUnit.catchment, shapeOptions);
        this.state = {
            leafletGeoJSON,
            catchmentGeoJSON,
            editGeoJsonEnabled: false,
            editCatchmentEnabled: false,
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
        setDrawMessages(formatMessage);
        this.map.leafletElement.createPane('custom-shape-pane');

        this.map.leafletElement.on('draw:created', (e) => {
            if (e.layerType === 'polygon' && e.layer.options.className.includes('primary')) {
                e.layer.addTo(editableGeoJsonFeatureGroup);
                setOrgUnitLocationModified();
                this.onChangeGeoJson();
            }
            if (e.layerType === 'polygon' && e.layer.options.className.includes('secondary')) {
                e.layer.addTo(editableCatchmentFeatureGroup);
                setOrgUnitLocationModified();
                this.onChangeCatchment();
            }
            if (e.layerType === 'marker') {
                e.layer.addTo(editableGeoJsonFeatureGroup);
                this.props.onChangeLocation(e.layer.getLatLng());
                this.map.leafletElement.removeLayer(e.layer);
            }
        });
        this.map.leafletElement.on('draw:editvertex', () => {
            setOrgUnitLocationModified();
        });
        const drawGeoJson = addDrawControl(this.map.leafletElement, editableGeoJsonFeatureGroup);
        editGeoJsonHandler = drawGeoJson.editHandler;
        drawGeoJsonControl = drawGeoJson.drawControl;

        const drawCatchment = addDrawControl(this.map.leafletElement, editableCatchmentFeatureGroup);
        editCatchmentHandler = drawCatchment.editHandler;

        if (this.props.orgUnit.geo_json) {
            this.updateShape(this.state.leafletGeoJSON, true);
        }
        if (this.props.orgUnit.catchment) {
            this.updateCatchment(this.state.catchmentGeoJSON, true);
        }
        this.fitToBounds();
    }


    componentWillReceiveProps(newProps) {
        if (!isEqual(newProps.orgUnit.geo_json, this.props.orgUnit.geo_json)) {
            this.mapGeoJson(newProps.orgUnit.geo_json);
        }
        if (!isEqual(newProps.orgUnit.catchment, this.props.orgUnit.catchment)) {
            this.mapCatchment(newProps.orgUnit.catchment);
        }
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
        editableGeoJsonFeatureGroup = new L.FeatureGroup();
        editableCatchmentFeatureGroup = new L.FeatureGroup();
        if (this.state.editGeoJsonEnabled) {
            this.toggleEditShape();
        }
        if (this.state.editCatchmentEnabled) {
            this.toggleEditCatchment();
        }
    }

    onChangeGeoJson() {
        const { onChangeGeoJson } = this.props;

        if (!editableGeoJsonFeatureGroup || !onChangeGeoJson) {
            return;
        }
        const geojsonData = editableGeoJsonFeatureGroup.toGeoJSON();
        onChangeGeoJson(geojsonData);
    }

    onChangeCatchment() {
        const { onChangeCatchment } = this.props;

        if (!editableCatchmentFeatureGroup || !onChangeCatchment) {
            return;
        }
        const geojsonData = editableCatchmentFeatureGroup.toGeoJSON();
        onChangeCatchment(geojsonData);
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
        this.updateShape(leafletGeoJSON);
    }

    mapCatchment(geoJson) {
        const catchmentGeoJSON = geoJson ? L.geoJson(geoJson, shapeOptions) : null;
        this.setState({
            catchmentGeoJSON,
        });
        this.updateCatchment(catchmentGeoJSON);
    }

    updateShape(leafletGeoJSON = this.state.leafletGeoJSON) {
        editableGeoJsonFeatureGroup.clearLayers();
        if (leafletGeoJSON) {
            leafletGeoJSON.eachLayer((layer) => {
                const tempLayer = layer;
                tempLayer.options.className = 'primary no-pointer-event';
                tempLayer.options.pane = 'custom-shape-pane';
                tempLayer.addTo(editableGeoJsonFeatureGroup);
            });
        }
    }

    updateCatchment(catchmentGeoJSON = this.state.catchmentGeoJSON) {
        editableCatchmentFeatureGroup.clearLayers();
        if (catchmentGeoJSON) {
            catchmentGeoJSON.eachLayer((layer) => {
                const tempLayer = layer;
                tempLayer.options.className = 'secondary no-pointer-event';
                tempLayer.options.pane = 'custom-shape-pane';
                tempLayer.addTo(editableCatchmentFeatureGroup);
            });
        }
    }

    fitToBounds() {
        const { currentTile, orgUnit } = this.props;

        const groups = [];
        if (orgUnit.geo_json) {
            groups.push(editableGeoJsonFeatureGroup);
        }
        if (orgUnit.catchment) {
            groups.push(editableCatchmentFeatureGroup);
        }
        if (groups.length > 1) {
            const group = new L.FeatureGroup(groups);
            this.map.leafletElement.fitBounds(group.getBounds(), { maxZoom: currentTile.maxZoom, padding, animate: false });
        }
        if (orgUnit.latitude && orgUnit.longitude) {
            const latlng = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
            const markerBounds = L.latLngBounds(latlng);
            this.map.leafletElement.fitBounds(markerBounds, { maxZoom: 10, padding, animate: false });
        }
    }

    toggleEditShape() {
        const { editGeoJsonEnabled } = this.state;

        if (!editGeoJsonEnabled) {
            editGeoJsonHandler.enable();
        } else {
            editGeoJsonHandler.disable();
        }
        this.setState({
            editGeoJsonEnabled: !editGeoJsonEnabled,
        });
    }

    toggleEditCatchment() {
        const { editCatchmentEnabled } = this.state;

        if (!editCatchmentEnabled) {
            editCatchmentHandler.enable();
        } else {
            editCatchmentHandler.disable();
        }
        this.setState({
            editCatchmentEnabled: !editCatchmentEnabled,
        });
    }

    addShape(shapeType) {
        new L.Draw.Polygon(
            this.map.leafletElement,
            polygonDrawOpiton(shapeType === 'catchment' ? 'secondary' : 'primary'),
        ).enable();
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
        const { onChangeGeoJson, onChangeLocation, setOrgUnitLocationModified } = this.props;
        if (newOrgUnit.latitude && newOrgUnit.longitude) {
            onChangeLocation({
                lat: newOrgUnit.latitude,
                lng: newOrgUnit.longitude,
            });
        } else if (newOrgUnit.has_geo_json) {
            setOrgUnitLocationModified();
            onChangeGeoJson(newOrgUnit.geo_json);
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
        const {
            editGeoJsonEnabled,
            editCatchmentEnabled,
            currentOption,
        } = this.state;
        const hasMarker = Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        const mappedOrgUnitTypesSelected = mapOrgUnitByLocation(orgUnitTypesSelected);
        const mappedSourcesSelected = mapOrgUnitByLocation(sourcesSelected);
        const currentOrgUnitHasLocation = orgUnit.has_geo_json || (orgUnit.latitude && orgUnit.longitude);
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    setCurrentOption={option => this.setCurrentOption(option)}
                    settingsDisabled={editGeoJsonEnabled}
                    filtersDisabled={editGeoJsonEnabled}
                    footerComponent={(
                        <OrgunitOptionSaveComponent
                            orgUnit={orgUnit}
                            editGeoJsonEnabled={editGeoJsonEnabled}
                            editCatchmentEnabled={editCatchmentEnabled}
                            toggleEditShape={() => this.toggleEditShape()}
                            toggleEditCatchment={() => this.toggleEditCatchment()}
                            mapGeoJson={geoJson => this.mapGeoJson(geoJson)}
                            mapCatchment={catchment => this.mapCatchment(catchment)}
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
                            editGeoJsonEnabled={editGeoJsonEnabled}
                            editCatchmentEnabled={editCatchmentEnabled}
                            onChangeGeoJson={() => this.onChangeGeoJson()}
                            onChangeCatchment={() => this.onChangeCatchment()}
                            onDeleteGeoJson={() => {
                                setOrgUnitLocationModified();
                                this.props.onChangeGeoJson(null);
                            }}
                            onDeleteCatchment={() => {
                                setOrgUnitLocationModified();
                                this.props.onChangeCatchment(null);
                            }}
                            toggleEditShape={() => this.toggleEditShape()}
                            toggleEditCatchment={() => this.toggleEditCatchment()}
                            addMarker={() => addMarker()}
                            addShape={shapeType => this.addShape(shapeType)}
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
                        keyboard={false}
                    >
                        <TileLayer
                            attribution={currentTile.attribution ? currentTile.attribution : ''}
                            url={currentTile.url}
                        />
                        {!editGeoJsonEnabled
                            && mappedOrgUnitTypesSelected.map(ot => (
                                <Fragment key={ot.id}>
                                    <MarkersListComponent
                                        items={ot.orgUnits.locations}
                                        onMarkerClick={o => this.fetchSubOrgUnitDetail(o)}
                                        PopupComponent={OrgUnitPopupComponent}
                                        popupProps={{
                                            displayUseLocation: (Boolean(orgUnit.latitude && orgUnit.longitude)) || !currentOrgUnitHasLocation,
                                            useLocation: selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit),
                                        }}
                                        customMarker={colorMarker(ot.color, 'white-pentagon.svg')}
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
                                                    displayUseLocation={orgUnit.has_geo_json || !currentOrgUnitHasLocation}
                                                    useLocation={selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit)}
                                                />
                                            </GeoJSON>
                                        ))
                                    }
                                </Fragment>
                            ))
                        }
                        {!editGeoJsonEnabled
                            && formsSelected.map(f => (
                                <MarkersListComponent
                                    key={f.id}
                                    items={f.instances}
                                    onMarkerClick={i => this.fetchInstanceDetail(i)}
                                    PopupComponent={InstancePopupComponent}
                                    popupProps={{
                                        displayUseLocation: (orgUnit.latitude && orgUnit.longitude) || !currentOrgUnitHasLocation,
                                        useLocation: selectedOrgUnit => this.useOrgUnitLocation(selectedOrgUnit),
                                    }}
                                    customMarker={colorMarker(f.color, 'white-form.svg')}
                                />
                            ))
                        }
                        {mappedSourcesSelected.map(s => (
                            <Fragment key={s.id}>
                                <MarkersListComponent
                                    items={s.orgUnits.locations}
                                    onMarkerClick={o => this.fetchSubOrgUnitDetail(o)}
                                    PopupComponent={OrgUnitPopupComponent}
                                    customMarker={colorMarker(s.color)}
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
                                                displayUseLocation={orgUnit.has_geo_json || !currentOrgUnitHasLocation}
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
    onChangeGeoJson: PropTypes.func.isRequired,
    onChangeCatchment: PropTypes.func.isRequired,
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