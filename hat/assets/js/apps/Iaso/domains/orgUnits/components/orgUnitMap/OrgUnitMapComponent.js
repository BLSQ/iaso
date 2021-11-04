import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Map, TileLayer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import isEqual from 'lodash/isEqual';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-draw';
import { withStyles } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

import PropTypes from 'prop-types';
import { injectIntl } from 'bluesquare-components';

import {
    mapOrgUnitByLocation,
    colorClusterCustomMarker,
    getleafletGeoJson,
    orderOrgUnitTypeByDepth,
    ZoomControl,
} from '../../../../utils/mapUtils';
import { getMarkerList } from '../../utils';

import TileSwitch from '../../../../components/maps/tools/TileSwitchComponent';
import EditOrgUnitOptionComponent from './EditOrgUnitOptionComponent';
import OrgunitOptionSaveComponent from '../OrgunitOptionSaveComponent';
import FormsFilterComponent from '../../../forms/components/FormsFilterComponent';
import OrgUnitTypeFilterComponent from '../../../forms/components/OrgUnitTypeFilterComponent';
import SourcesFilterComponent from '../../../forms/components/SourcesFilterComponent';
import MarkerComponent from '../../../../components/maps/markers/MarkerComponent';
import InnerDrawer from '../../../../components/nav/InnerDrawer';

import OrgUnitPopupComponent from '../OrgUnitPopupComponent';
import setDrawMessages from '../../../../utils/map/drawMapMessages';
import { resetMapReducer } from '../../../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../../actions';
import { setCurrentInstance } from '../../../instances/actions';
import { OrgUnitsMapComments } from './OrgUnitsMapComments';

import {
    fetchOrgUnitDetail,
    fetchInstanceDetail,
} from '../../../../utils/requests';
import MESSAGES from '../../messages';

import 'leaflet-draw/dist/leaflet.draw.css';
import InstancePopupComponent from '../../../instances/components/InstancePopupComponent';

import EditableGroup from './EditableGroup';
import fitToBounds from './fitToBounds';

import {
    hasFeatureFlag,
    EDIT_GEO_JSON_RIGHT,
    EDIT_CATCHMENT_RIGHT,
} from '../../../../utils/featureFlags';

export const zoom = 5;
export const padding = [75, 75];
const clusterSize = 25;

const buttonsInitialState = {
    location: {
        add: false,
        edit: false,
        delete: false,
    },
    catchment: {
        add: false,
        edit: false,
        delete: false,
    },
};

// passing the theme to make it accessible through withStyles
// eslint-disable-next-line no-unused-vars
const styles = theme => ({
    commentContainer: {
        height: '60vh',
        overflowY: 'auto',
    },
});

const orgunitsPane = 'org-units';

const initialState = currentUser => {
    return {
        locationGroup: new EditableGroup(),
        catchmentGroup: new EditableGroup(),
        canEditLocation: hasFeatureFlag(currentUser, EDIT_GEO_JSON_RIGHT),
        canEditCatchment: hasFeatureFlag(currentUser, EDIT_CATCHMENT_RIGHT),
        currentOption: 'filters',
        formsSelected: [],
        orgUnitTypesSelected: [],
        ...buttonsInitialState,
    };
};

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = initialState(props.currentUser);
        this.useOrgUnitLocation = this.useOrgUnitLocation.bind(this);
    }

    async componentDidMount() {
        const {
            intl: { formatMessage },
            orgUnit,
            onChangeShape,
            onChangeLocation,
        } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        setDrawMessages(formatMessage);
        locationGroup.initialize({
            map,
            groupKey: 'location',
            onChangeShape: shape => onChangeShape('geo_json', shape),
            onChangeLocation,
            geoJson: getleafletGeoJson(orgUnit.geo_json),
            classNames: 'primary',
            onAdd: () => this.toggleAddShape('location'),
        });
        catchmentGroup.initialize({
            map,
            groupKey: 'catchment',
            onChangeShape: shape => onChangeShape('catchment', shape),
            onChangeLocation,
            geoJson: getleafletGeoJson(orgUnit.catchment),
            classNames: 'secondary',
            tooltipMessage: formatMessage(MESSAGES.catchment),
            onAdd: () => this.toggleAddShape('catchment'),
        });
        this.fitToBounds();
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
        const { resetOrgUnit, setOrgUnitLocationModified } = this.props;
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;

        locationGroup.reset(map);
        catchmentGroup.reset(map);
        this.setState({
            ...buttonsInitialState,
        });
        setOrgUnitLocationModified(false);
        resetOrgUnit();
    }

    setCurrentOption(currentOption) {
        this.setState({
            currentOption,
        });
    }

    fitToBounds() {
        const { currentTile, orgUnit, sourcesSelected } = this.props;
        const {
            location,
            locationGroup,
            catchmentGroup,
            formsSelected,
            orgUnitTypesSelected,
        } = this.state;
        fitToBounds({
            padding,
            currentTile,
            orgUnit,
            orgUnitTypesSelected,
            sourcesSelected,
            formsSelected,
            editLocationEnabled: location.edit,
            locationGroup,
            catchmentGroup,
            map: this.map.leafletElement,
        });
    }

    toggleEditShape(keyName) {
        const editEnabled = this.state[keyName].edit;
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        const group = keyName === 'location' ? locationGroup : catchmentGroup;
        group.toggleEditShape(map, !editEnabled);
        this.setState({
            [keyName]: {
                ...this.state[keyName],
                edit: !editEnabled,
            },
        });
    }

    toggleAddShape(keyName) {
        const addEnabled = this.state[keyName].add;
        const { locationGroup, catchmentGroup } = this.state;
        if (addEnabled) {
            const group =
                keyName === 'location' ? locationGroup : catchmentGroup;
            group.shapeAdded.disable();
        }
        this.setState({
            [keyName]: {
                ...this.state[keyName],
                add: !addEnabled,
            },
        });
    }

    toggleDeleteShape(keyName) {
        const deleteEnabled = this.state[keyName].delete;
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        const group = keyName === 'location' ? locationGroup : catchmentGroup;
        group.toggleDeleteShape(map, !deleteEnabled);
        this.setState({
            [keyName]: {
                ...this.state[keyName],
                delete: !deleteEnabled,
            },
        });
    }

    addShape(keyName) {
        const { locationGroup, catchmentGroup } = this.state;
        const map = this.map.leafletElement;
        if (keyName === 'location') {
            locationGroup.addShape(map, 'primary');
        }
        if (keyName === 'catchment') {
            catchmentGroup.addShape(map, 'secondary');
        }
        this.toggleAddShape(keyName);
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
                alt: newOrgUnit.altitude,
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
            saveOrgUnit,
            orgUnitLocationModified,
            classes,
            orgUnitTypes,
            setSourcesSelected,
            sourcesSelected,
        } = this.props;
        const {
            location,
            catchment,
            currentOption,
            locationGroup,
            canEditLocation,
            canEditCatchment,
            formsSelected,
            orgUnitTypesSelected,
            catchmentGroup,
        } = this.state;
        const hasMarker =
            Boolean(orgUnit.latitude) && Boolean(orgUnit.longitude);
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        const mappedOrgUnitTypesSelected = mapOrgUnitByLocation(
            orderOrgUnitTypeByDepth(orgUnitTypesSelected) || [],
        );
        const mappedSourcesSelected = mapOrgUnitByLocation(
            sourcesSelected || [],
        );
        const actionBusy =
            location.edit ||
            location.delete ||
            location.add ||
            catchment.edit ||
            catchment.delete ||
            catchment.add;
        const getSourceShape = (s, o) => (
            <GeoJSON
                style={{
                    color: s.color,
                }}
                key={o.id}
                data={o.geo_json}
                onClick={() => this.fetchSubOrgUnitDetail(o)}
            >
                <OrgUnitPopupComponent
                    displayUseLocation
                    useLocation={selectedOrgUnit =>
                        this.useOrgUnitLocation(selectedOrgUnit)
                    }
                />
            </GeoJSON>
        );
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    setCurrentOption={option => this.setCurrentOption(option)}
                    settingsDisabled={actionBusy}
                    filtersDisabled={actionBusy}
                    defaultActiveOption="filters"
                    commentsDisabled={actionBusy}
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
                            <SourcesFilterComponent
                                fitToBounds={() => this.fitToBounds()}
                                sourcesSelected={sourcesSelected}
                                setSourcesSelected={setSourcesSelected}
                            />
                            <OrgUnitTypeFilterComponent
                                fitToBounds={() => this.fitToBounds()}
                                orgUnitTypesSelected={orgUnitTypesSelected}
                                setOrgUnitTypesSelected={outypes => {
                                    this.setState({
                                        orgUnitTypesSelected: outypes,
                                    });
                                }}
                            />
                            <FormsFilterComponent
                                formsSelected={formsSelected}
                                setFormsSelected={forms => {
                                    this.setState({ formsSelected: forms });
                                    fitToBounds({
                                        padding,
                                        currentTile,
                                        orgUnit,
                                        orgUnitTypesSelected,
                                        sourcesSelected,
                                        formsSelected: forms,
                                        editLocationEnabled: location.edit,
                                        locationGroup,
                                        catchmentGroup,
                                        map: this.map.leafletElement,
                                    });
                                }}
                            />
                        </>
                    }
                    editOptionComponent={
                        <EditOrgUnitOptionComponent
                            orgUnit={orgUnit}
                            canEditLocation={canEditLocation}
                            canEditCatchment={canEditCatchment}
                            locationState={location}
                            catchmentState={catchment}
                            toggleEditShape={keyValue =>
                                this.toggleEditShape(keyValue)
                            }
                            toggleDeleteShape={keyValue =>
                                this.toggleDeleteShape(keyValue)
                            }
                            toggleAddShape={keyValue =>
                                this.toggleAddShape(keyValue)
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
                    commentsOptionComponent={
                        <OrgUnitsMapComments
                            orgUnit={orgUnit}
                            className={classes.commentContainer}
                            maxPages={4}
                        />
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
                        <ZoomControl fitToBounds={() => this.fitToBounds()} />

                        <ScaleControl imperial={false} />
                        <TileLayer
                            attribution={
                                currentTile.attribution
                                    ? currentTile.attribution
                                    : ''
                            }
                            url={currentTile.url}
                        />
                        {!location.edit && (
                            <>
                                {mappedSourcesSelected.map(ms => {
                                    const shapes = ms.orgUnits.shapes.filter(
                                        o => !o.org_unit_type_id,
                                    );
                                    if (shapes.length > 0) {
                                        return (
                                            <Pane
                                                name={`no-org-unit-type-${ms.id}`}
                                                key={ms.id}
                                            >
                                                {shapes.map(o =>
                                                    getSourceShape(ms, o),
                                                )}
                                            </Pane>
                                        );
                                    }
                                    return null;
                                })}
                                {orgUnitTypes.map(ot => {
                                    const selectedOut =
                                        mappedOrgUnitTypesSelected.find(
                                            mot => mot.id === ot.id,
                                        );

                                    const sourcesOrgUnits =
                                        mappedSourcesSelected.filter(ms =>
                                            ms.orgUnits.shapes.some(
                                                o =>
                                                    o.org_unit_type_id ===
                                                    ot.id,
                                            ),
                                        );
                                    if (
                                        selectedOut ||
                                        sourcesOrgUnits.length > 0
                                    ) {
                                        return (
                                            <Pane
                                                style={{
                                                    zIndex:
                                                        400 + (ot.depth || 1),
                                                }}
                                                name={`${orgunitsPane}-type-${ot.id}-${ot.name}`}
                                                key={ot.id}
                                            >
                                                {selectedOut &&
                                                    selectedOut.orgUnits.shapes.map(
                                                        o => (
                                                            <GeoJSON
                                                                key={o.id}
                                                                data={
                                                                    o.geo_json
                                                                }
                                                                onClick={() =>
                                                                    this.fetchSubOrgUnitDetail(
                                                                        o,
                                                                    )
                                                                }
                                                                style={() => ({
                                                                    color: ot.color,
                                                                })}
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
                                                        ),
                                                    )}

                                                {sourcesOrgUnits.map(s =>
                                                    s.orgUnits.shapes.map(o =>
                                                        getSourceShape(s, o),
                                                    ),
                                                )}
                                            </Pane>
                                        );
                                    }
                                    return null;
                                })}
                            </>
                        )}

                        <Pane
                            name={`${orgunitsPane}-markers`}
                            style={{ zIndex: 698 }}
                        >
                            {mappedOrgUnitTypesSelected.map(ot => (
                                <MarkerClusterGroup
                                    key={ot.id}
                                    maxClusterRadius={5}
                                    iconCreateFunction={cluster =>
                                        colorClusterCustomMarker(
                                            cluster,
                                            ot.color,
                                            clusterSize,
                                        )
                                    }
                                >
                                    {getMarkerList({
                                        locationsList: ot.orgUnits.locations,
                                        fetchDetail: a =>
                                            this.fetchSubOrgUnitDetail(a),
                                        color: ot.color,
                                        keyId: ot.id,
                                        useOrgUnitLocation:
                                            this.useOrgUnitLocation,
                                    })}
                                </MarkerClusterGroup>
                            ))}
                            {mappedSourcesSelected.map(s => (
                                <MarkerClusterGroup
                                    key={s.id}
                                    maxClusterRadius={5}
                                    iconCreateFunction={cluster =>
                                        colorClusterCustomMarker(
                                            cluster,
                                            s.color,
                                            clusterSize,
                                        )
                                    }
                                >
                                    {getMarkerList({
                                        locationsList: s.orgUnits.locations,
                                        fetchDetail: a =>
                                            this.fetchSubOrgUnitDetail(a),
                                        color: s.color,
                                        keyId: s.id,
                                        useOrgUnitLocation:
                                            this.useOrgUnitLocation,
                                    })}
                                </MarkerClusterGroup>
                            ))}

                            {formsSelected.map(f => (
                                <MarkerClusterGroup
                                    key={f.id}
                                    maxClusterRadius={5}
                                    iconCreateFunction={cluster =>
                                        colorClusterCustomMarker(
                                            cluster,
                                            f.color,
                                            clusterSize,
                                        )
                                    }
                                >
                                    {getMarkerList({
                                        locationsList: f.instances,
                                        fetchDetail: a =>
                                            this.fetchInstanceDetail(a),
                                        color: f.color,
                                        keyId: f.id,
                                        PopupComponent: InstancePopupComponent,
                                        useOrgUnitLocation:
                                            this.useOrgUnitLocation,
                                    })}
                                </MarkerClusterGroup>
                            ))}
                        </Pane>

                        {hasMarker && currentOption !== 'edit' && (
                            <Pane
                                name={`${orgunitsPane}-current-marker`}
                                style={{ zIndex: 699 }}
                            >
                                <MarkerComponent
                                    item={orgUnit}
                                    draggable={currentOption === 'edit'}
                                    onDragend={newMarker =>
                                        this.props.onChangeLocation(
                                            newMarker.getLatLng(),
                                        )
                                    }
                                />
                            </Pane>
                        )}
                        {hasMarker && currentOption === 'edit' && (
                            <Pane
                                name={`${orgunitsPane}-edit-markers`}
                                style={{ zIndex: 699 }}
                            >
                                <MarkerComponent
                                    item={orgUnit}
                                    draggable={currentOption === 'edit'}
                                    onDragend={newMarker =>
                                        this.props.onChangeLocation(
                                            newMarker.getLatLng(),
                                        )
                                    }
                                />
                            </Pane>
                        )}
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}

OrgUnitMapComponent.defaultProps = {
    sourcesSelected: [],
};

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChangeShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    setCurrentSubOrgUnit: PropTypes.func.isRequired,
    setCurrentInstance: PropTypes.func.isRequired,
    sourcesSelected: PropTypes.array,
    resetOrgUnit: PropTypes.func.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
    setOrgUnitLocationModified: PropTypes.func.isRequired,
    orgUnitLocationModified: PropTypes.bool.isRequired,
    currentUser: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    setSourcesSelected: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    currentUser: state.users.current,
    currentTile: state.map.currentTile,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
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
)(withStyles(styles)(injectIntl(OrgUnitMapComponent)));
