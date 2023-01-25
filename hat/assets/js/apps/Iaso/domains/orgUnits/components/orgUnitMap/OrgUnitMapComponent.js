import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Map, TileLayer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import isEqual from 'lodash/isEqual';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-draw';
import { withStyles, withTheme } from '@material-ui/core/styles';
import pink from '@material-ui/core/colors/pink';

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
import SourcesFilterComponent from '../SourcesFilterComponent';
import MarkerComponent from '../../../../components/maps/markers/MarkerComponent';
import InnerDrawer from '../../../../components/nav/InnerDrawer';
import { MapLegend } from '../../../../components/maps/MapLegend.tsx';

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
// import InstancePopupComponent from '../../../instances/components/InstancePopupComponent';
import { InstancePopup } from '../../../instances/components/InstancePopUp/InstancePopUp.tsx';
import EditableGroup from './EditableGroup';
import fitToBounds from './fitToBounds';

import {
    hasFeatureFlag,
    EDIT_GEO_JSON_RIGHT,
    EDIT_CATCHMENT_RIGHT,
} from '../../../../utils/featureFlags';
import { userHasPermission } from '../../../users/utils';

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

const getAncestorWithGeojson = orgUnit => {
    let ancestorWithGeoJson;
    for (let ancestor = orgUnit.parent; ancestor; ancestor = ancestor.parent) {
        if (ancestor.geo_json) {
            ancestorWithGeoJson = ancestor;
            break;
        }
    }
    return ancestorWithGeoJson;
};

const initialState = currentUser => {
    return {
        locationGroup: new EditableGroup(),
        catchmentGroup: new EditableGroup(),
        canEditLocation: hasFeatureFlag(currentUser, EDIT_GEO_JSON_RIGHT),
        canEditCatchment: hasFeatureFlag(currentUser, EDIT_CATCHMENT_RIGHT),
        currentOption: 'filters',
        formsSelected: [],
        orgUnitTypesSelected: [],
        ancestorWithGeoJson: undefined,
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
            currentOrgUnit,
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
            geoJson: getleafletGeoJson(currentOrgUnit.geo_json),
            classNames: 'primary',
            onAdd: () => this.toggleAddShape('location'),
        });
        catchmentGroup.initialize({
            map,
            groupKey: 'catchment',
            onChangeShape: shape => onChangeShape('catchment', shape),
            onChangeLocation,
            geoJson: getleafletGeoJson(currentOrgUnit.catchment),
            classNames: 'secondary',
            tooltipMessage: formatMessage(MESSAGES.catchment),
            onAdd: () => this.toggleAddShape('catchment'),
        });
    }

    componentDidUpdate(prevProps) {
        const { locationGroup, catchmentGroup, ancestorWithGeoJson } =
            this.state;
        const {
            intl: { formatMessage },
            currentOrgUnit,
            sourcesSelected,
        } = this.props;
        // When no linked org unit from other sources
        if (
            (prevProps.loadingSelectedSources === true &&
                this.props.loadingSelectedSources === false) ||
            (this.props.loadingSelectedSources === false &&
                sourcesSelected.length === 0)
        ) {
            this.fitToBounds();
            // When linked org unit from other sources, fetch shape first
        } else if (
            !isEqual(prevProps.currentOrgUnit.geo_json, currentOrgUnit.geo_json)
        ) {
            locationGroup.updateShape(
                getleafletGeoJson(currentOrgUnit.geo_json),
                'primary',
            );
        }
        if (
            !isEqual(
                prevProps.currentOrgUnit.catchment,
                currentOrgUnit.catchment,
            )
        ) {
            catchmentGroup.updateShape(
                getleafletGeoJson(currentOrgUnit.catchment),
                'secondary',
                formatMessage(MESSAGES.catchment),
            );
        }
        if (
            getAncestorWithGeojson(currentOrgUnit)?.id !==
            ancestorWithGeoJson?.id
        ) {
            this.setAncestor();
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

    setAncestor() {
        const { currentOrgUnit } = this.props;
        const ancestor = getAncestorWithGeojson(currentOrgUnit);

        if (ancestor) {
            this.setState({ ancestorWithGeoJson: ancestor });
        }
    }

    setCurrentOption(currentOption) {
        this.setState({
            currentOption,
        });
    }

    fitToBounds() {
        const { currentTile, currentOrgUnit, sourcesSelected } = this.props;
        const {
            location,
            locationGroup,
            catchmentGroup,
            formsSelected,
            orgUnitTypesSelected,
            ancestorWithGeoJson,
        } = this.state;
        fitToBounds({
            padding,
            currentTile,
            orgUnit: currentOrgUnit,
            orgUnitTypesSelected,
            sourcesSelected,
            formsSelected,
            editLocationEnabled: location.edit,
            locationGroup,
            catchmentGroup,
            map: this.map.leafletElement,
            ancestorWithGeoJson,
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
            currentOrgUnit,
            currentTile,
            saveOrgUnit,
            orgUnitLocationModified,
            classes,
            orgUnitTypes,
            setSourcesSelected,
            sourcesSelected,
            sources,
            loadingSelectedSources,
            intl: { formatMessage },
            theme,
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
            ancestorWithGeoJson,
        } = this.state;

        console.log('catchment group', catchmentGroup);
        const hasMarker =
            Boolean(currentOrgUnit.latitude) &&
            Boolean(currentOrgUnit.longitude);
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
                    titleMessage={formatMessage(MESSAGES.ouLinked)}
                    displayUseLocation
                    replaceLocation={selectedOrgUnit =>
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
                            orgUnit={currentOrgUnit}
                            resetOrgUnit={() => this.handleReset()}
                            orgUnitLocationModified={orgUnitLocationModified}
                            saveOrgUnit={saveOrgUnit}
                        />
                    }
                    filtersOptionComponent={
                        <>
                            <SourcesFilterComponent
                                loadingSelectedSources={loadingSelectedSources}
                                currentOrgUnit={currentOrgUnit}
                                currentSources={sources}
                                fitToBounds={() => this.fitToBounds()}
                                sourcesSelected={sourcesSelected}
                                setSourcesSelected={setSourcesSelected}
                            />
                            <OrgUnitTypeFilterComponent
                                currentOrgUnit={currentOrgUnit}
                                orgUnitTypes={orgUnitTypes}
                                fitToBounds={() => this.fitToBounds()}
                                orgUnitTypesSelected={orgUnitTypesSelected}
                                setOrgUnitTypesSelected={outypes => {
                                    this.setState({
                                        orgUnitTypesSelected: outypes,
                                    });
                                }}
                            />
                            {userHasPermission(
                                'iaso_submissions',
                                this.props.currentUser,
                            ) && (
                                <FormsFilterComponent
                                    currentOrgUnit={currentOrgUnit}
                                    formsSelected={formsSelected}
                                    setFormsSelected={forms => {
                                        this.setState({ formsSelected: forms });
                                        fitToBounds({
                                            padding,
                                            currentTile,
                                            orgUnit: currentOrgUnit,
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
                            )}
                        </>
                    }
                    editOptionComponent={
                        <EditOrgUnitOptionComponent
                            orgUnit={currentOrgUnit}
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
                            orgUnit={currentOrgUnit}
                            className={classes.commentContainer}
                            maxPages={4}
                        />
                    }
                >
                    <MapLegend
                        options={[
                            {
                                value: 'ouCurrent',
                                label: formatMessage(MESSAGES.ouCurrent),
                                color: theme.palette.primary.main,
                            },
                            {
                                value: 'ouParent',
                                label: formatMessage(MESSAGES.ouParent),
                                color: pink['300'],
                            },
                        ]}
                    />
                    <Map
                        key={currentOrgUnit.id}
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
                        {!location.edit && ancestorWithGeoJson && (
                            <Pane
                                name="parent-shape"
                                style={{
                                    zIndex: 350,
                                }}
                            >
                                <GeoJSON
                                    data={ancestorWithGeoJson.geo_json}
                                    style={() => ({
                                        color: pink['300'],
                                    })}
                                >
                                    <OrgUnitPopupComponent
                                        titleMessage={formatMessage(
                                            MESSAGES.ouParent,
                                        )}
                                        currentOrgUnit={ancestorWithGeoJson}
                                    />
                                </GeoJSON>
                            </Pane>
                        )}
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
                                                                    titleMessage={formatMessage(
                                                                        MESSAGES.ouChild,
                                                                    )}
                                                                    displayUseLocation
                                                                    replaceLocation={selectedOrgUnit =>
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
                                <Pane
                                    name={`${orgunitsPane}-markers-${ot.id}-${ot.name}`}
                                    style={{ zIndex: 698 }}
                                >
                                    {getMarkerList({
                                        locationsList: ot.orgUnits.locations,
                                        fetchDetail: a =>
                                            this.fetchSubOrgUnitDetail(a),
                                        color: ot.color,
                                        keyId: ot.id,
                                        updateOrgUnitLocation:
                                            this.useOrgUnitLocation,
                                    })}
                                </Pane>
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
                                <Pane
                                    name={`${orgunitsPane}-markers-${s.id}`}
                                    style={{ zIndex: 698 }}
                                >
                                    {getMarkerList({
                                        locationsList: s.orgUnits.locations,
                                        fetchDetail: a =>
                                            this.fetchSubOrgUnitDetail(a),
                                        color: s.color,
                                        keyId: s.id,
                                        updateOrgUnitLocation:
                                            this.useOrgUnitLocation,
                                    })}
                                </Pane>
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
                                <Pane
                                    name={`${orgunitsPane}-markers-${f.id}`}
                                    style={{ zIndex: 698 }}
                                >
                                    {getMarkerList({
                                        locationsList: f.instances,
                                        fetchDetail: a =>
                                            this.fetchInstanceDetail(a),
                                        color: f.color,
                                        keyId: f.id,
                                        PopupComponent: InstancePopup,
                                        updateOrgUnitLocation:
                                            this.useOrgUnitLocation,
                                    })}
                                </Pane>
                            </MarkerClusterGroup>
                        ))}

                        {hasMarker && currentOption !== 'edit' && (
                            <Pane
                                name={`${orgunitsPane}-current-marker`}
                                style={{ zIndex: 699 }}
                            >
                                <MarkerComponent
                                    item={currentOrgUnit}
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
                                    item={currentOrgUnit}
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
    loadingSelectedSources: undefined,
};

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
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
    sources: PropTypes.array.isRequired,
    currentOrgUnit: PropTypes.object.isRequired,
    loadingSelectedSources: PropTypes.bool,
    theme: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentUser: state.users.current,
    currentTile: state.map.currentTile,
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
)(withStyles(styles)(withTheme(injectIntl(OrgUnitMapComponent))));
