import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import isEqual from 'lodash/isEqual';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-draw';
import { withTheme } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

import L from 'leaflet';
import PropTypes from 'prop-types';
import { injectIntl } from 'bluesquare-components';
import {
    mapOrgUnitByLocation,
    shapeOptions,
    colorClusterCustomMarker,
} from '../../../../utils/mapUtils';
import { getMarkerList } from '../../utils';

import TileSwitch from '../../../../components/maps/tools/TileSwitchComponent';
import InnerDrawer from '../../../../components/nav/InnerDrawerComponent';
import EditOrgUnitOptionComponent from '../EditOrgUnitOptionComponent';
import OrgunitOptionSaveComponent from '../OrgunitOptionSaveComponent';
import OrgUnitTypeChipsFilterComponent from '../OrgUnitTypeChipsFilterComponent';
import FormsChipsFilterComponent from '../../../forms/components/FormsChipsFilterComponent';
import SourcesChipsFilterComponent from '../../../../components/filters/chips/SourcesChipsFilterComponent';
import MarkerComponent from '../../../../components/maps/markers/MarkerComponent';
import OrgUnitPopupComponent from '../OrgUnitPopupComponent';

import { resetMapReducer } from '../../../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../../actions';
import { setCurrentInstance } from '../../../instances/actions';

import {
    fetchOrgUnitDetail,
    fetchInstanceDetail,
} from '../../../../utils/requests';
import MESSAGES from '../../messages';

import 'leaflet-draw/dist/leaflet.draw.css';
import InstancePopupComponent from '../../../instances/components/InstancePopupComponent';

import EditableGroup from './EditableGoup';

import { zoom, padding, resetIndex, setToFront, getGeoJson } from './utils';

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            locationGroup: new EditableGroup(),
            catchmentGroup: new EditableGroup(),
            editGeoJson: {
                location: false,
                catchment: false,
            },
            deleteGeoJson: {
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
            onChangeShape,
            onChangeLocation,
        } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        let leafletGeoJSON;
        let catchmentGeoJSON;
        if (this.props.orgUnit.geo_json) {
            leafletGeoJSON = L.geoJson(orgUnit.geo_json, shapeOptions);
        }
        if (this.props.orgUnit.catchment) {
            catchmentGeoJSON = L.geoJson(orgUnit.catchment, shapeOptions);
        }
        const map = this.map.leafletElement;
        map.createPane('custom-shape-draw');
        locationGroup.initialize({
            map,
            groupKey: 'location',
            onChangeShape: shape => onChangeShape('geo_json', shape),
            onChangeLocation,
            geoJson: leafletGeoJSON,
            classNames: 'primary',
        });
        catchmentGroup.initialize({
            map,
            groupKey: 'catchment',
            onChangeShape: shape => onChangeShape('catchment', shape),
            onChangeLocation,
            geoJson: catchmentGeoJSON,
            classNames: 'secondary',
            tooltipMessage: formatMessage(MESSAGES.catchment),
        });
    }

    componentDidUpdate(prevProps) {
        const { locationGroup, catchmentGroup } = this.state;
        const {
            intl: { formatMessage },
        } = this.props;
        if (!isEqual(prevProps.orgUnit.geo_json, this.props.orgUnit.geo_json)) {
            const leafletGeoJSON = L.geoJson(
                this.props.orgUnit.geo_json,
                shapeOptions,
            );
            locationGroup.updateShape(leafletGeoJSON, 'primary');
        }
        if (
            !isEqual(prevProps.orgUnit.catchment, this.props.orgUnit.catchment)
        ) {
            const catchmentGeoJSON = L.geoJson(
                this.props.orgUnit.catchment,
                shapeOptions,
            );
            catchmentGroup.updateShape(
                catchmentGeoJSON,
                'secondary',
                formatMessage(MESSAGES.catchment),
            );
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
        const { locationGroup, catchmentGroup } = this.state;
        catchmentGroup.clearLayers();
        locationGroup.clearLayers();

        if (this.state.editGeoJson.location) {
            this.toggleEditShape('location');
        }
        if (this.state.editGeoJson.catchment) {
            this.toggleEditShape('catchment');
        }
    }

    handleReset() {
        const { resetOrgUnit, setOrgUnitLocationModified } = this.props;
        const { editGeoJson, deleteGeoJson } = this.state;
        if (editGeoJson.location) {
            this.toggleEditShape('location');
        }
        if (editGeoJson.catchment) {
            this.toggleEditShape('catchment');
        }
        if (deleteGeoJson.location) {
            this.toggleDeleteShape('location');
        }
        if (deleteGeoJson.catchment) {
            this.toggleDeleteShape('catchment');
        }
        setOrgUnitLocationModified(false);
        resetOrgUnit();
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
        const { editGeoJson, locationGroup, catchmentGroup } = this.state;

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
            groups.push(locationGroup.group);
        }
        if (orgUnit.catchment) {
            groups.push(catchmentGroup.group);
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
        const { onChangeShape } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        if (keyValue === 'location') {
            locationGroup.toggleEditShape(!editEnabled);
            if (editEnabled) {
                onChangeShape('geo_json', getGeoJson(locationGroup.group));
            }
        }
        if (keyValue === 'catchment') {
            catchmentGroup.toggleEditShape(!editEnabled);
            if (editEnabled) {
                onChangeShape('catchment', getGeoJson(catchmentGroup.group));
            }
        }
        if (!editEnabled) {
            setToFront(this.map.leafletElement, keyValue);
        } else {
            resetIndex(this.map.leafletElement);
        }
        this.setState({
            editGeoJson: {
                ...this.state.editGeoJson,
                [keyValue]: !this.state.editGeoJson[keyValue],
            },
        });
    }

    toggleDeleteShape(keyValue) {
        const deleteEnabled = this.state.deleteGeoJson[keyValue];
        const { onChangeShape } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        if (keyValue === 'location') {
            if (deleteEnabled) {
                onChangeShape('geo_json', getGeoJson(locationGroup.group));
            }
            locationGroup.toggleDeleteShape(!deleteEnabled);
        }
        if (keyValue === 'catchment') {
            if (deleteEnabled) {
                onChangeShape('catchment', getGeoJson(catchmentGroup.group));
            }
            catchmentGroup.toggleDeleteShape(!deleteEnabled);
        }

        if (!deleteEnabled) {
            setToFront(this.map.leafletElement, keyValue);
        } else {
            resetIndex(this.map.leafletElement);
        }
        this.setState({
            deleteGeoJson: {
                ...this.state.deleteGeoJson,
                [keyValue]: !this.state.deleteGeoJson[keyValue],
            },
        });
    }

    addShape(keyName) {
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        if (keyName === 'geo_json') {
            locationGroup.addShape(map, 'primary');
        }
        if (keyName === 'catchment') {
            catchmentGroup.addShape(map, 'secondary');
        }
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
            orgUnitLocationModified,
            theme,
        } = this.props;
        const { editGeoJson, deleteGeoJson, currentOption, locationGroup } =
            this.state;
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
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    setCurrentOption={option => this.setCurrentOption(option)}
                    settingsDisabled={editGeoJson.location}
                    filtersDisabled={editGeoJson.location}
                    footerComponent={
                        <OrgunitOptionSaveComponent
                            orgUnit={orgUnit}
                            resetOrgUnit={() => this.handleReset()}
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
                        <EditOrgUnitOptionComponent
                            orgUnit={orgUnit}
                            editLocationEnabled={editGeoJson.location}
                            editCatchmentEnabled={editGeoJson.catchment}
                            deleteLocationEnabled={deleteGeoJson.location}
                            deleteCatchmentEnabled={deleteGeoJson.catchment}
                            toggleEditShape={keyValue =>
                                this.toggleEditShape(keyValue)
                            }
                            toggleDeleteShape={keyValue =>
                                this.toggleDeleteShape(keyValue)
                            }
                            addMarker={() =>
                                locationGroup.toggleDrawMarker(true)
                            }
                            addShape={shapeType => this.addShape(shapeType)}
                            onChangeLocation={latLong =>
                                this.props.onChangeLocation(latLong)
                            }
                        />
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
                        {!editGeoJson.location &&
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
