import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-draw';
import { withTheme } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

import L from 'leaflet';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { injectIntl } from 'bluesquare-components';
import setDrawMessages from '../../../utils/map/drawMapMessages';
import {
    customZoomBar,
    addDrawControl,
    mapOrgUnitByLocation,
    shapeOptions,
    polygonDrawOpiton,
    colorClusterCustomMarker,
} from '../../../utils/mapUtils';
import { getMarkerList } from '../utils';

import TileSwitch from '../../../components/maps/tools/TileSwitchComponent';
import InnerDrawer from '../../../components/nav/InnerDrawerComponent';
import EditOrgUnitOptionComponent from './EditOrgUnitOptionComponent';
import OrgunitOptionSaveComponent from './OrgunitOptionSaveComponent';
import OrgUnitTypeChipsFilterComponent from './OrgUnitTypeChipsFilterComponent';
import FormsChipsFilterComponent from '../../forms/components/FormsChipsFilterComponent';
import SourcesChipsFilterComponent from '../../../components/filters/chips/SourcesChipsFilterComponent';
import MarkerComponent from '../../../components/maps/markers/MarkerComponent';
import OrgUnitPopupComponent from './OrgUnitPopupComponent';

import { resetMapReducer } from '../../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../actions';
import { setCurrentInstance } from '../../instances/actions';

import {
    fetchOrgUnitDetail,
    fetchInstanceDetail,
} from '../../../utils/requests';

import 'leaflet-draw/dist/leaflet.draw.css';
import InstancePopupComponent from '../../instances/components/InstancePopupComponent';

const zoom = 5;
const padding = [75, 75];

const editableFetureGroups = {
    location: {
        group: new L.FeatureGroup(),
        editHandler: null,
        drawControl: null,
    },
    catchment: {
        group: new L.FeatureGroup(),
        editHandler: null,
    },
};

const addMarker = () => {
    editableFetureGroups.location.drawControl._toolbars.draw._modes.marker.handler.enable();
};

const updateShape = (geoJson, key) => {
    editableFetureGroups[key].group.clearLayers();
    if (geoJson) {
        geoJson.eachLayer(layer => {
            const tempLayer = layer;
            tempLayer.options.className = `${
                key === 'location' ? 'primary' : 'secondary'
            } no-pointer-event`;
            tempLayer.options.pane = 'custom-shape-pane';
            tempLayer.addTo(editableFetureGroups[key].group);
        });
    }
};

const mapShape = (geoJson, keyValue) => {
    const leafletGeoJSON = geoJson ? L.geoJson(geoJson, shapeOptions) : null;
    updateShape(leafletGeoJSON, keyValue);
};

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editGeoJson: {
                location: false,
                catchment: false,
            },
            currentOption: 'filters',
        };
    }

    componentDidMount() {
        const {
            intl: { formatMessage },
            orgUnit,
            setOrgUnitLocationModified,
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        setDrawMessages(formatMessage);
        this.map.leafletElement.createPane('custom-shape-pane');

        this.map.leafletElement.on('draw:created', e => {
            if (
                e.layerType === 'polygon' &&
                e.layer.options.className.includes('primary')
            ) {
                e.layer.addTo(editableFetureGroups.location.group);
                setOrgUnitLocationModified();
                this.onChangeShape('location');
            }
            if (
                e.layerType === 'polygon' &&
                e.layer.options.className.includes('secondary')
            ) {
                e.layer.addTo(editableFetureGroups.catchment.group);
                setOrgUnitLocationModified();
                this.onChangeShape('catchment');
            }
            if (e.layerType === 'marker') {
                e.layer.addTo(editableFetureGroups.location.group);
                this.props.onChangeLocation(e.layer.getLatLng());
                this.map.leafletElement.removeLayer(e.layer);
            }
        });
        this.map.leafletElement.on('draw:editvertex', () => {
            setOrgUnitLocationModified();
        });
        const drawGeoJson = addDrawControl(
            this.map.leafletElement,
            editableFetureGroups.location.group,
        );
        editableFetureGroups.location.editHandler = drawGeoJson.editHandler;
        editableFetureGroups.location.drawControl = drawGeoJson.drawControl;

        const drawCatchment = addDrawControl(
            this.map.leafletElement,
            editableFetureGroups.catchment.group,
        );
        editableFetureGroups.catchment.editHandler = drawCatchment.editHandler;

        if (this.props.orgUnit.geo_json) {
            const leafletGeoJSON = L.geoJson(orgUnit.geo_json, shapeOptions);
            updateShape(leafletGeoJSON, 'location');
        }
        if (this.props.orgUnit.catchment) {
            const catchmentGeoJSON = L.geoJson(orgUnit.catchment, shapeOptions);
            updateShape(catchmentGeoJSON, 'catchment');
        }
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.orgUnit.geo_json, this.props.orgUnit.geo_json)) {
            mapShape(prevProps.orgUnit.geo_json, 'location');
        }
        if (
            !isEqual(prevProps.orgUnit.catchment, this.props.orgUnit.catchment)
        ) {
            mapShape(prevProps.orgUnit.catchment, 'catchment');
        }
        if (
            this.props.sourcesSelected &&
            !prevProps.sourcesSelected &&
            this.props.orgUnitTypesSelected
        ) {
            this.fitToBounds();
        }
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
        editableFetureGroups.location.group = new L.FeatureGroup();
        editableFetureGroups.catchment.group = new L.FeatureGroup();
        if (this.state.editGeoJson.location) {
            this.toggleEditShape('location');
        }
        if (this.state.editGeoJson.catchment) {
            this.toggleEditShape('catchment');
        }
    }

    onChangeShape(keyValue) {
        const { onChangeShape } = this.props;

        if (!editableFetureGroups[keyValue].group || !onChangeShape) {
            return;
        }
        const geojsonData = editableFetureGroups[keyValue].group.toGeoJSON();
        const tempKeyValue = keyValue === 'location' ? 'geo_json' : keyValue;
        onChangeShape(tempKeyValue, geojsonData);
    }

    setCurrentOption(currentOption) {
        this.setState({
            currentOption,
        });
    }

    fitToBounds() {
        const {
            currentTile,
            orgUnit,
            orgUnitTypesSelected,
            sourcesSelected,
            formsSelected,
        } = this.props;
        const { editGeoJson } = this.state;

        const mappedOrgUnitTypesSelected = mapOrgUnitByLocation(
            orgUnitTypesSelected || [],
        );
        const mappedSourcesSelected = mapOrgUnitByLocation(
            sourcesSelected || [],
        );
        const editLocationEnabled = editGeoJson.location;

        const groups = [];
        const locations = [];
        let shapesBounds;
        mappedOrgUnitTypesSelected.forEach(ot => {
            ot.orgUnits.locations.forEach(o => {
                locations.push(L.latLng(o.latitude, o.longitude));
            });
            ot.orgUnits.shapes.forEach(o => {
                const tempBounds = L.geoJSON(o.geo_json);
                if (shapesBounds) {
                    shapesBounds = shapesBounds.extend(tempBounds.getBounds());
                } else {
                    shapesBounds = tempBounds.getBounds();
                }
            });
        });

        mappedSourcesSelected.forEach(s => {
            s.orgUnits.locations.forEach(o => {
                locations.push(L.latLng(o.latitude, o.longitude));
            });
            s.orgUnits.shapes.forEach(o => {
                const tempBounds = L.geoJSON(o.geo_json);
                if (shapesBounds) {
                    shapesBounds = shapesBounds.extend(tempBounds.getBounds());
                } else {
                    shapesBounds = tempBounds.getBounds();
                }
            });
        });
        if (!editLocationEnabled && formsSelected && formsSelected.instances) {
            formsSelected.instances.forEach(i => {
                locations.push(L.latLng(i.latitude, i.longitude));
            });
        }
        const locationsBounds = L.latLngBounds(locations);
        const otherBounds = locationsBounds.extend(shapesBounds);
        if (orgUnit.geo_json) {
            groups.push(editableFetureGroups.location.group);
        }
        if (orgUnit.catchment) {
            groups.push(editableFetureGroups.catchment.group);
        }
        const group = new L.FeatureGroup(groups);
        if (orgUnit.latitude && orgUnit.longitude) {
            const latlng = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
            let bounds = L.latLngBounds(latlng);
            if (groups.length > 0) {
                const groupBounds = group.getBounds();
                bounds = groupBounds.extend(bounds);
            }
            bounds = otherBounds.extend(bounds);
            this.map.leafletElement.fitBounds(bounds, {
                maxZoom: 10,
                padding,
                animate: false,
            });
        } else if (groups.length > 0) {
            let bounds = group.getBounds();
            bounds = otherBounds.extend(bounds);
            this.map.leafletElement.fitBounds(bounds, {
                maxZoom: currentTile.maxZoom,
                padding,
                animate: false,
            });
        } else if (otherBounds._southWest) {
            this.map.leafletElement.fitBounds(otherBounds, {
                maxZoom: currentTile.maxZoom,
                padding,
                animate: false,
            });
        }
    }

    toggleEditShape(keyValue) {
        const editEnabled = this.state.editGeoJson[keyValue];

        if (!editEnabled) {
            editableFetureGroups[keyValue].editHandler.enable();
        } else {
            editableFetureGroups[keyValue].editHandler.disable();
        }
        this.setState({
            editGeoJson: {
                ...this.state.editGeoJson,
                [keyValue]: !this.state.editGeoJson[keyValue],
            },
        });
    }

    addShape(shapeType) {
        new L.Draw.Polygon(
            this.map.leafletElement,
            polygonDrawOpiton(
                shapeType === 'catchment' ? 'secondary' : 'primary',
            ),
        ).enable();
    }

    fetchSubOrgUnitDetail(orgUnit) {
        const { dispatch } = this.props;
        this.props.setCurrentSubOrgUnit(null);
        fetchOrgUnitDetail(dispatch, orgUnit.id).then(i =>
            this.props.setCurrentSubOrgUnit(i),
        );
    }

    fetchInstanceDetail(instance) {
        const { dispatch } = this.props;
        this.props.setCurrentInstance(null);
        fetchInstanceDetail(dispatch, instance.id).then(i =>
            this.props.setCurrentInstance(i),
        );
    }

    useOrgUnitLocation(newOrgUnit) {
        const { onChangeShape, onChangeLocation, setOrgUnitLocationModified } =
            this.props;
        if (newOrgUnit.latitude && newOrgUnit.longitude) {
            onChangeLocation({
                lat: newOrgUnit.latitude,
                lng: newOrgUnit.longitude,
            });
        } else if (newOrgUnit.has_geo_json) {
            setOrgUnitLocationModified();
            onChangeShape('geo_json', newOrgUnit.geo_json);
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
            theme,
        } = this.props;
        const { editGeoJson, currentOption } = this.state;
        const editLocationEnabled = editGeoJson.location;
        const editCatchmentEnabled = editGeoJson.catchment;
        const hasMarker =
            Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        const mappedOrgUnitTypesSelected = mapOrgUnitByLocation(
            orgUnitTypesSelected || [],
        );
        const mappedSourcesSelected = mapOrgUnitByLocation(
            sourcesSelected || [],
        );
        const showEditComponent = hasMarker || !orgUnit.geo_json;
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    setCurrentOption={option => this.setCurrentOption(option)}
                    settingsDisabled={editLocationEnabled}
                    filtersDisabled={editLocationEnabled}
                    footerComponent={
                        <OrgunitOptionSaveComponent
                            orgUnit={orgUnit}
                            editLocationEnabled={editLocationEnabled}
                            editCatchmentEnabled={editCatchmentEnabled}
                            toggleEditShape={keyValue =>
                                this.toggleEditShape(keyValue)
                            }
                            mapShape={(geoJson, keyValue) =>
                                mapShape(geoJson, keyValue)
                            }
                            resetOrgUnit={resetOrgUnit}
                            orgUnitLocationModified={orgUnitLocationModified}
                            saveOrgUnit={saveOrgUnit}
                        />
                    }
                    filtersOptionComponent={
                        <>
                            <SourcesChipsFilterComponent
                                fitToBounds={() => this.fitToBounds()}
                            />
                            <OrgUnitTypeChipsFilterComponent
                                fitToBounds={() => this.fitToBounds()}
                            />
                            <FormsChipsFilterComponent
                                fitToBounds={() => this.fitToBounds()}
                            />
                        </>
                    }
                    editOptionComponent={
                        showEditComponent ? (
                            <EditOrgUnitOptionComponent
                                orgUnit={orgUnit}
                                editLocationEnabled={editLocationEnabled}
                                editCatchmentEnabled={editCatchmentEnabled}
                                onChangeShape={keyValue =>
                                    this.onChangeShape(keyValue)
                                }
                                onDeleteShape={keyValue => {
                                    setOrgUnitLocationModified();
                                    this.props.onChangeShape(
                                        keyValue === 'location'
                                            ? 'geo_json'
                                            : 'catchment',
                                        null,
                                    );
                                }}
                                toggleEditShape={keyValue =>
                                    this.toggleEditShape(keyValue)
                                }
                                addMarker={() => addMarker()}
                                addShape={shapeType => this.addShape(shapeType)}
                                onChangeLocation={latLong =>
                                    this.props.onChangeLocation(latLong)
                                }
                            />
                        ) : null
                    }
                    settingsOptionComponent={
                        <>
                            <TileSwitch />
                        </>
                    }
                >
                    <Map
                        scrollWheelZoom={false}
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        ref={ref => {
                            this.map = ref;
                        }}
                        center={[0, 0]}
                        boundsOptions={{ padding }}
                        zoom={zoom}
                        zoomControl={false}
                        keyboard={false}
                    >
                        <TileLayer
                            attribution={
                                currentTile.attribution
                                    ? currentTile.attribution
                                    : ''
                            }
                            url={currentTile.url}
                        />
                        {!editLocationEnabled &&
                            mappedOrgUnitTypesSelected.map(ot =>
                                ot.orgUnits.shapes.map(o => (
                                    <GeoJSON
                                        key={o.id}
                                        data={o.geo_json}
                                        onClick={() =>
                                            this.fetchSubOrgUnitDetail(o)
                                        }
                                        style={() => ({ color: ot.color })}
                                    >
                                        <OrgUnitPopupComponent
                                            displayUseLocation
                                            useLocation={selectedOrgUnit =>
                                                this.useOrgUnitLocation(
                                                    selectedOrgUnit,
                                                )
                                            }
                                        />
                                    </GeoJSON>
                                )),
                            )}
                        {mappedSourcesSelected.map(s =>
                            s.orgUnits.shapes.map(o => (
                                <GeoJSON
                                    key={o.id}
                                    data={o.geo_json}
                                    onClick={() =>
                                        this.fetchSubOrgUnitDetail(o)
                                    }
                                    style={() => ({ color: s.color })}
                                >
                                    <OrgUnitPopupComponent
                                        displayUseLocation
                                        useLocation={selectedOrgUnit =>
                                            this.useOrgUnitLocation(
                                                selectedOrgUnit,
                                            )
                                        }
                                    />
                                </GeoJSON>
                            )),
                        )}
                        <MarkerClusterGroup
                            maxClusterRadius={0} // only apply cluster on markers with same coordinates
                            iconCreateFunction={cluster =>
                                colorClusterCustomMarker(
                                    cluster,
                                    theme.palette.secondary.main,
                                )
                            }
                        >
                            {mappedOrgUnitTypesSelected.map(ot =>
                                getMarkerList(
                                    ot.orgUnits.locations,
                                    a => this.fetchSubOrgUnitDetail(a),
                                    ot.color,
                                    ot.id,
                                ),
                            )}
                            {mappedSourcesSelected.map(s =>
                                getMarkerList(
                                    s.orgUnits.locations,
                                    a => this.fetchSubOrgUnitDetail(a),
                                    s.color,
                                    s.id,
                                ),
                            )}
                            {formsSelected.map(f =>
                                getMarkerList(
                                    f.instances,
                                    a => this.fetchInstanceDetail(a),
                                    f.color,
                                    f.id,
                                    InstancePopupComponent,
                                ),
                            )}
                            {hasMarker && currentOption !== 'edit' && (
                                <MarkerComponent
                                    item={orgUnit}
                                    draggable={currentOption === 'edit'}
                                    onDragend={newMarker =>
                                        this.props.onChangeLocation(
                                            newMarker.getLatLng(),
                                        )
                                    }
                                />
                            )}
                        </MarkerClusterGroup>

                        {hasMarker && currentOption === 'edit' && (
                            <MarkerComponent
                                item={orgUnit}
                                draggable={currentOption === 'edit'}
                                onDragend={newMarker =>
                                    this.props.onChangeLocation(
                                        newMarker.getLatLng(),
                                    )
                                }
                            />
                        )}
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}
OrgUnitMapComponent.defaultProps = {
    sourcesSelected: undefined,
    orgUnitTypesSelected: undefined,
};

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChangeShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    formsSelected: PropTypes.array.isRequired,
    setCurrentSubOrgUnit: PropTypes.func.isRequired,
    setCurrentInstance: PropTypes.func.isRequired,
    sourcesSelected: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    orgUnitTypesSelected: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.array,
    ]),
    resetOrgUnit: PropTypes.func.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
    setOrgUnitLocationModified: PropTypes.func.isRequired,
    orgUnitLocationModified: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
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

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(withTheme(injectIntl(OrgUnitMapComponent)));
