import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import isEqual from 'lodash/isEqual';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-draw';
import { withTheme } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

import PropTypes from 'prop-types';
import { injectIntl } from 'bluesquare-components';
import {
    mapOrgUnitByLocation,
    colorClusterCustomMarker,
    customZoomBar,
    getleafletGeoJson,
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
import setDrawMessages from '../../../../utils/map/drawMapMessages';
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
import fitToBounds from './fitToBounds';

export const zoom = 5;
export const padding = [75, 75];
const EDIT_GEO_JSON_RIGHT = 'ALLOW_SHAPE_EDITION';
const EDIT_CATCHMENT_RIGHT = 'ALLOW_CATCHMENT_EDITION';

const hasFeatureFlag = (currentUser, featureKey) =>
    Boolean(currentUser?.account?.feature_flags?.includes(featureKey));

const initialState = currentUser => {
    return {
        locationGroup: new EditableGroup(),
        catchmentGroup: new EditableGroup(),
        canEditLocation: hasFeatureFlag(currentUser, EDIT_GEO_JSON_RIGHT),
        canEditCatchment: hasFeatureFlag(currentUser, EDIT_CATCHMENT_RIGHT),
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
};

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = initialState(props.currentUser);
    }

    componentDidMount() {
        const {
            intl: { formatMessage },
            orgUnit,
            onChangeShape,
            onChangeLocation,
        } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        const map = this.map.leafletElement;
        setDrawMessages(formatMessage);
        locationGroup.initialize({
            map,
            groupKey: 'location',
            onChangeShape: shape => onChangeShape('geo_json', shape),
            onChangeLocation,
            geoJson: getleafletGeoJson(orgUnit.geo_json),
            classNames: 'primary',
        });
        catchmentGroup.initialize({
            map,
            groupKey: 'catchment',
            onChangeShape: shape => onChangeShape('catchment', shape),
            onChangeLocation,
            geoJson: getleafletGeoJson(orgUnit.catchment),
            classNames: 'secondary',
            tooltipMessage: formatMessage(MESSAGES.catchment),
        });
    }

    componentDidUpdate(prevProps) {
        const { locationGroup, catchmentGroup } = this.state;
        const {
            intl: { formatMessage },
            orgUnit,
        } = this.props;
        if (!isEqual(prevProps.orgUnit.geo_json, orgUnit.geo_json)) {
            locationGroup.updateShape(
                getleafletGeoJson(orgUnit.geo_json),
                'primary',
            );
        }
        if (!isEqual(prevProps.orgUnit.catchment, orgUnit.catchment)) {
            catchmentGroup.updateShape(
                getleafletGeoJson(orgUnit.catchment),
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
        const { currentUser } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        locationGroup.reset(map);
        catchmentGroup.reset(map);
        this.setState(initialState(currentUser));
    }

    handleReset() {
        const { resetOrgUnit, setOrgUnitLocationModified, currentUser } =
            this.props;
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;

        locationGroup.reset(map);
        catchmentGroup.reset(map);
        this.setState(initialState(currentUser));
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
        fitToBounds({
            padding,
            currentTile,
            orgUnit,
            orgUnitTypesSelected,
            sourcesSelected,
            formsSelected,
            editGeoJson,
            locationGroup,
            catchmentGroup,
            map: this.map.leafletElement,
        });
    }

    toggleEditShape(keyName) {
        const editEnabled = this.state.editGeoJson[keyName];
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        const group = keyName === 'location' ? locationGroup : catchmentGroup;
        group.toggleEditShape(map, !editEnabled);
        this.setState({
            editGeoJson: {
                ...this.state.editGeoJson,
                [keyName]: !this.state.editGeoJson[keyName],
            },
        });
    }

    toggleDeleteShape(keyName) {
        const deleteEnabled = this.state.deleteGeoJson[keyName];
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        const group = keyName === 'location' ? locationGroup : catchmentGroup;
        group.toggleDeleteShape(map, !deleteEnabled);
        this.setState({
            deleteGeoJson: {
                ...this.state.deleteGeoJson,
                [keyName]: !this.state.deleteGeoJson[keyName],
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
        const {
            editGeoJson,
            deleteGeoJson,
            currentOption,
            locationGroup,
            canEditLocation,
            canEditCatchment,
        } = this.state;
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
                            canEditLocation={canEditLocation}
                            canEditCatchment={canEditCatchment}
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
    currentUser: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentUser: state.users.current,
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
