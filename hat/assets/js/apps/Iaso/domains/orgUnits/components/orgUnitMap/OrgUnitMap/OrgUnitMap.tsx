import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Map, TileLayer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-draw';
import pink from '@material-ui/core/colors/pink';
import { Grid, makeStyles, useTheme } from '@material-ui/core';
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';

import {
    mapOrgUnitByLocation,
    colorClusterCustomMarker,
    getleafletGeoJson,
    orderOrgUnitTypeByDepth,
    ZoomControl,
} from '../../../../../utils/mapUtils';
import { getMarkerList } from '../../../utils';
import TileSwitch from '../../../../../components/maps/tools/TileSwitchComponent';
import EditOrgUnitOptionComponent from '../EditOrgUnitOptionComponent';
import OrgunitOptionSaveComponent from '../../OrgunitOptionSaveComponent';
import FormsFilterComponent from '../../../../forms/components/FormsFilterComponent';
import OrgUnitTypeFilterComponent from '../../../../forms/components/OrgUnitTypeFilterComponent';
import SourcesFilterComponent from '../../SourcesFilterComponent';
import MarkerComponent from '../../../../../components/maps/markers/MarkerComponent';
import InnerDrawer from '../../../../../components/nav/InnerDrawer';
import { MapLegend } from '../../../../../components/maps/MapLegend';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';
import setDrawMessages from '../../../../../utils/map/drawMapMessages';
import { resetMapReducer as resetMapReducerAction } from '../../../../../redux/mapReducer';
import { setCurrentSubOrgUnit as setCurrentSubOrgUnitAction } from '../../../actions';
import { setCurrentInstance as setCurrentInstanceAction } from '../../../../instances/actions';
import { OrgUnitsMapComments } from '../OrgUnitsMapComments';
import {
    fetchOrgUnitDetail,
    fetchInstanceDetail as fetchInstanceDetailRequest,
} from '../../../../../utils/requests';
import MESSAGES from '../../../messages';

import 'leaflet-draw/dist/leaflet.draw.css';
// import InstancePopupComponent from '../../../instances/components/InstancePopupComponent';
import { InstancePopup } from '../../../../instances/components/InstancePopUp/InstancePopUp';
import fitToBoundsFn from '../fitToBounds';
import { userHasPermission } from '../../../../users/utils';
import { useCurrentUser } from '../../../../../utils/usersUtils';
import { useFormState } from '../../../../../hooks/form';
import { SourceShape } from './SourceShape';
import {
    buttonsInitialState,
    getAncestorWithGeojson,
    initialState,
} from './utils';

export const zoom = 5;
export const padding = [75, 75];
const clusterSize = 25;
const orgunitsPane = 'org-units';

const useStyles = makeStyles({
    commentContainer: {
        height: '60vh',
        overflowY: 'auto',
    },
});

type Props = {
    loadingSelectedSources?: boolean;
    sourcesSelected?: any[];
    setSourcesSelected: () => void;
    currentOrgUnit: any;
    saveOrgUnit: () => void;
    resetOrgUnit: () => void;
    orgUnitLocationModified: boolean;
    // eslint-disable-next-line no-unused-vars
    setOrgUnitLocationModified: (isModified: boolean) => void;
    // eslint-disable-next-line no-unused-vars
    onChangeShape: (key, geoJson) => void;
    // eslint-disable-next-line no-unused-vars
    onChangeLocation: (location) => void;
    sources: any[];
    orgUnitTypes: any[];
};

export const OrgUnitMap: FunctionComponent<Props> = ({
    sources,
    sourcesSelected = [],
    setSourcesSelected,
    loadingSelectedSources,
    currentOrgUnit,
    orgUnitTypes,
    resetOrgUnit,
    saveOrgUnit,
    orgUnitLocationModified,
    setOrgUnitLocationModified,
    onChangeLocation,
    onChangeShape,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    const currentUser = useCurrentUser();
    const map: any = useRef();
    const didLocationInitialize = useRef(false);
    const didCatchmentInitialize = useRef(false);
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const [state, setStateField, _, setState] = useFormState(
        initialState(currentUser),
    );
    const dispatch = useDispatch();
    const currentTile = useSelector(
        (reduxState: any) => reduxState.map.currentTile,
    );
    const setCurrentSubOrgUnit = useCallback(
        o => dispatch(setCurrentSubOrgUnitAction(o)),
        [dispatch],
    );

    const setCurrentInstance = useCallback(
        i => dispatch(setCurrentInstanceAction(i)),
        [dispatch],
    );

    const resetMapReducer = useCallback(
        () => dispatch(resetMapReducerAction()),
        [dispatch],
    );

    const setAncestor = useCallback(() => {
        const ancestor = getAncestorWithGeojson(currentOrgUnit);
        if (ancestor) {
            setStateField('ancestorWithGeoJson', ancestor);
        }
    }, [currentOrgUnit, setStateField]);

    const setCurrentOption = useCallback(
        currentOption => {
            setStateField('currentOption', currentOption);
        },
        [setStateField],
    );

    const handleReset = useCallback(() => {
        const mapToReset = map.current.leafletElement;
        state.locationGroup.value.reset(mapToReset);
        state.catchmentGroup.value.reset(mapToReset);
        setStateField('location', buttonsInitialState.location);
        setStateField('catchment', buttonsInitialState.catchment);
        setOrgUnitLocationModified(false);
        resetOrgUnit();
    }, [
        resetOrgUnit,
        setOrgUnitLocationModified,
        setStateField,
        state.locationGroup.value,
        state.catchmentGroup.value,
    ]);
    const fitToBounds = useCallback(() => {
        fitToBoundsFn({
            padding,
            currentTile,
            orgUnit: currentOrgUnit,
            orgUnitTypesSelected: state.orgUnitTypesSelected.value,
            sourcesSelected,
            formsSelected: state.formsSelected.value,
            editLocationEnabled: state.location.value.edit,
            locationGroup: state.locationGroup.value,
            catchmentGroup: state.catchmentGroup.value,
            map: map.current.leafletElement,
            ancestorWithGeoJson: state.ancestorWithGeoJson.value,
        });
    }, [
        currentTile,
        currentOrgUnit,
        state.orgUnitTypesSelected.value,
        state.formsSelected.value,
        state.location.value.edit,
        state.locationGroup.value,
        state.catchmentGroup.value,
        state.ancestorWithGeoJson.value,
        sourcesSelected,
    ]);

    const toggleEditShape = useCallback(
        keyName => {
            const editEnabled = state[keyName].value.edit;
            const leafletMap = map.current.leafletElement;
            const group =
                keyName === 'location'
                    ? state.locationGroup.value
                    : state.catchmentGroup.value;
            group.toggleEditShape(leafletMap, !editEnabled);
            setStateField(keyName, {
                ...state[keyName].value,
                edit: !editEnabled,
            });
        },
        [state, setStateField],
    );

    const toggleAddShape = useCallback(
        keyName => {
            const addEnabled = state[keyName].value.add;
            if (addEnabled) {
                const group =
                    keyName === 'location'
                        ? state.locationGroup.value
                        : state.catchmentGroup.value;
                group.shapeAdded.disable();
            }
            setStateField(keyName, {
                ...state[keyName].value,
                add: !addEnabled,
            });
        },
        [state, setStateField],
    );

    const toggleDeleteShape = useCallback(
        keyName => {
            const deleteEnabled = state[keyName].value.delete;
            const leafletMap = map.current.leafletElement;
            const group =
                keyName === 'location'
                    ? state.locationGroup.value
                    : state.catchmentGroup.value;
            group.toggleDeleteShape(leafletMap, !deleteEnabled);
            setStateField(keyName, {
                ...state[keyName].value,
                delete: !deleteEnabled,
            });
        },
        [state, setStateField],
    );

    const addShape = useCallback(
        keyName => {
            const leafletMap = map.current.leafletElement;
            if (keyName === 'location') {
                state.locationGroup.value.addShape(leafletMap, 'primary');
            }
            if (keyName === 'catchment') {
                state.catchmentGroup.value.addShape(leafletMap, 'secondary');
            }
            toggleAddShape(keyName);
        },
        [state.catchmentGroup.value, state.locationGroup.value, toggleAddShape],
    );

    const handleFormFilter = useCallback(
        forms => {
            setStateField('formsSelected', forms);
        },
        [setStateField],
    );

    const fetchSubOrgUnitDetail = useCallback(
        orgUnit => {
            setCurrentSubOrgUnit(null);
            fetchOrgUnitDetail(dispatch, orgUnit.id).then(subOrgUnit =>
                setCurrentSubOrgUnit(subOrgUnit),
            );
        },
        [dispatch, setCurrentSubOrgUnit],
    );

    const fetchInstanceDetail = useCallback(
        instance => {
            setCurrentInstance(null);
            fetchInstanceDetailRequest(dispatch, instance.id).then(i =>
                setCurrentInstance(i),
            );
        },
        [dispatch, setCurrentInstance],
    );

    const updateOrgUnitLocation = useCallback(
        newOrgUnit => {
            if (newOrgUnit.latitude && newOrgUnit.longitude) {
                onChangeLocation({
                    lat: newOrgUnit.latitude,
                    lng: newOrgUnit.longitude,
                    alt: newOrgUnit.altitude,
                });
            } else if (newOrgUnit.has_geo_json) {
                setOrgUnitLocationModified(false); // What's the right value, the initial code passed nothing
                onChangeShape('geo_json', newOrgUnit.geo_json);
            }
        },
        [onChangeShape, onChangeLocation, setOrgUnitLocationModified],
    );

    const {
        location,
        catchment,
        currentOption,
        locationGroup,
        canEditLocation,
        canEditCatchment,
        formsSelected,
        orgUnitTypesSelected,
        ancestorWithGeoJson,
    } = state;

    const hasMarker =
        Boolean(currentOrgUnit.latitude) && Boolean(currentOrgUnit.longitude);

    if (map.current) {
        map.current.leafletElement.options.maxZoom = currentTile.maxZoom;
    }
    const mappedOrgUnitTypesSelected = useMemo(
        () =>
            mapOrgUnitByLocation(
                orderOrgUnitTypeByDepth(orgUnitTypesSelected.value) || [],
            ),
        [orgUnitTypesSelected.value],
    );

    const mappedSourcesSelected = useMemo(
        () => mapOrgUnitByLocation(sourcesSelected || []),
        [sourcesSelected],
    );
    const actionBusy =
        location.value.edit ||
        location.value.delete ||
        location.value.add ||
        catchment.value.edit ||
        catchment.value.delete ||
        catchment.value.add;

    useEffect(() => {
        setDrawMessages(formatMessage);
        // This effect should only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (
            !didLocationInitialize.current &&
            map.current?.leafletElement &&
            state.locationGroup.value
        ) {
            state.locationGroup.value.initialize({
                map: map.current.leafletElement,
                groupKey: 'location',
                onChangeShape: shape => onChangeShape('geo_json', shape),
                onChangeLocation,
                geoJson: getleafletGeoJson(currentOrgUnit.geo_json),
                classNames: 'primary',
                onAdd: () => toggleAddShape('location'),
            });
            didLocationInitialize.current = true;
        }
    });
    useEffect(() => {
        if (
            !didCatchmentInitialize.current &&
            map.current?.leafletElement &&
            state.catchmentGroup.value
        ) {
            state.catchmentGroup.value.initialize({
                map: map.current.leafletElement,
                groupKey: 'catchment',
                onChangeShape: shape => onChangeShape('catchment', shape),
                onChangeLocation,
                geoJson: getleafletGeoJson(currentOrgUnit.catchment),
                classNames: 'secondary',
                tooltipMessage: formatMessage(MESSAGES.catchment),
                onAdd: () => toggleAddShape('catchment'),
            });
            didCatchmentInitialize.current = true;
        }
    });

    useSkipEffectOnMount(() => {
        state.catchmentGroup.value.updateShape(
            getleafletGeoJson(currentOrgUnit.catchment),
            'secondary',
            formatMessage(MESSAGES.catchment),
        );

        // We only want this effect to run if there's a change in currentOrgUbnit.catchment
    }, [currentOrgUnit.catchment]);

    // skipping the deps array as we need to check the condition on each render to emulate componentDidUpdate
    useEffect(() => {
        if (
            getAncestorWithGeojson(currentOrgUnit)?.id !==
            state.ancestorWithGeoJson.value?.id
        ) {
            setAncestor();
        }
    });

    useSkipEffectOnMount(() => {
        fitToBounds();
    }, [
        sourcesSelected,
        state.orgUnitTypesSelected.value,
        state.formsSelected.value,
    ]);

    useSkipEffectOnMount(() => {
        // When linked org unit from other sources, fetch shape first
        if (loadingSelectedSources === true || sourcesSelected.length !== 0)
            state.locationGroup.value.updateShape(
                getleafletGeoJson(currentOrgUnit.geo_json),
                'primary',
            );
    }, [
        currentOrgUnit.geo_json,
        loadingSelectedSources,
        state.locationGroup.value,
    ]);

    // ComponentWillUnmount
    useEffect(() => {
        const currentMap = map.current.leafletElement;
        return () => {
            resetMapReducer();
            state.locationGroup.value.reset(currentMap);
            state.catchmentGroup.value.reset(currentMap);
            setState(initialState(currentUser));
        };
    }, [
        currentUser,
        resetMapReducer,
        setState,
        state.catchmentGroup.value,
        state.locationGroup.value,
    ]);

    return (
        <Grid container spacing={0}>
            <InnerDrawer
                setCurrentOption={option => setCurrentOption(option)}
                settingsDisabled={actionBusy}
                filtersDisabled={actionBusy}
                defaultActiveOption="filters"
                commentsDisabled={actionBusy}
                footerComponent={
                    <OrgunitOptionSaveComponent
                        orgUnit={currentOrgUnit}
                        resetOrgUnit={() => handleReset()}
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
                            fitToBounds={fitToBounds}
                            sourcesSelected={sourcesSelected}
                            setSourcesSelected={setSourcesSelected}
                        />
                        <OrgUnitTypeFilterComponent
                            currentOrgUnit={currentOrgUnit}
                            orgUnitTypes={orgUnitTypes}
                            fitToBounds={fitToBounds}
                            orgUnitTypesSelected={orgUnitTypesSelected.value}
                            setOrgUnitTypesSelected={outypes => {
                                setStateField('orgUnitTypesSelected', outypes);
                            }}
                        />
                        {userHasPermission('iaso_submissions', currentUser) && (
                            <FormsFilterComponent
                                currentOrgUnit={currentOrgUnit}
                                formsSelected={formsSelected.value}
                                setFormsSelected={handleFormFilter}
                            />
                        )}
                    </>
                }
                editOptionComponent={
                    <EditOrgUnitOptionComponent
                        orgUnit={currentOrgUnit}
                        canEditLocation={canEditLocation.value}
                        canEditCatchment={canEditCatchment.value}
                        locationState={state.location.value}
                        catchmentState={state.catchment.value}
                        toggleEditShape={keyValue => toggleEditShape(keyValue)}
                        toggleDeleteShape={keyValue =>
                            toggleDeleteShape(keyValue)
                        }
                        toggleAddShape={keyValue => toggleAddShape(keyValue)}
                        addMarker={() =>
                            locationGroup.value.toggleDrawMarker(true)
                        }
                        addShape={shapeType => addShape(shapeType)}
                        onChangeLocation={latLong => onChangeLocation(latLong)}
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
                    ref={map}
                    center={[0, 0]}
                    boundsOptions={{ padding }}
                    zoom={zoom}
                    zoomControl={false}
                    keyboard={false}
                >
                    <ZoomControl fitToBounds={fitToBounds} />

                    <ScaleControl imperial={false} />
                    <TileLayer
                        attribution={
                            currentTile.attribution
                                ? currentTile.attribution
                                : ''
                        }
                        url={currentTile.url}
                    />
                    {!location.value.edit && ancestorWithGeoJson.value && (
                        <Pane
                            name="parent-shape"
                            style={{
                                zIndex: 350,
                            }}
                        >
                            <GeoJSON
                                data={ancestorWithGeoJson.value.geo_json}
                                style={() => ({
                                    color: pink['300'],
                                })}
                            >
                                <OrgUnitPopupComponent
                                    titleMessage={formatMessage(
                                        MESSAGES.ouParent,
                                    )}
                                    currentOrgUnit={ancestorWithGeoJson.value}
                                />
                            </GeoJSON>
                        </Pane>
                    )}
                    {!location.value.edit && (
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
                                            {shapes.map(o => (
                                                <SourceShape
                                                    source={ms}
                                                    shape={o}
                                                    key={o.id}
                                                    replaceLocation={
                                                        updateOrgUnitLocation
                                                    }
                                                    onClick={() => {
                                                        fetchSubOrgUnitDetail(
                                                            o,
                                                        );
                                                    }}
                                                />
                                            ))}
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
                                            o => o.org_unit_type_id === ot.id,
                                        ),
                                    );
                                if (selectedOut || sourcesOrgUnits.length > 0) {
                                    return (
                                        <Pane
                                            style={{
                                                zIndex: 400 + (ot.depth || 1),
                                            }}
                                            name={`${orgunitsPane}-type-${ot.id}-${ot.name}`}
                                            key={ot.id}
                                        >
                                            {selectedOut &&
                                                selectedOut.orgUnits.shapes.map(
                                                    o => (
                                                        <GeoJSON
                                                            key={o.id}
                                                            data={o.geo_json}
                                                            onClick={() =>
                                                                fetchSubOrgUnitDetail(
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
                                                                    updateOrgUnitLocation(
                                                                        selectedOrgUnit,
                                                                    )
                                                                }
                                                            />
                                                        </GeoJSON>
                                                    ),
                                                )}

                                            {sourcesOrgUnits.map(s =>
                                                s.orgUnits.shapes.map(o => (
                                                    <SourceShape
                                                        source={s}
                                                        shape={o}
                                                        key={o.id}
                                                        replaceLocation={
                                                            updateOrgUnitLocation
                                                        }
                                                        onClick={() => {
                                                            fetchSubOrgUnitDetail(
                                                                o,
                                                            );
                                                        }}
                                                    />
                                                )),
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
                                    fetchDetail: a => fetchSubOrgUnitDetail(a),
                                    color: ot.color,
                                    keyId: ot.id,
                                    updateOrgUnitLocation,
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
                                    fetchDetail: a => fetchSubOrgUnitDetail(a),
                                    color: s.color,
                                    keyId: s.id,
                                    updateOrgUnitLocation,
                                })}
                            </Pane>
                        </MarkerClusterGroup>
                    ))}

                    {formsSelected.value.map(f => (
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
                                    fetchDetail: a => fetchInstanceDetail(a),
                                    color: f.color,
                                    keyId: f.id,
                                    // The underlying Marker components are all js components, Ts compiler infers a lot and sees errors
                                    // @ts-ignore
                                    PopupComponent: InstancePopup,
                                    updateOrgUnitLocation,
                                })}
                            </Pane>
                        </MarkerClusterGroup>
                    ))}

                    {hasMarker && currentOption.value !== 'edit' && (
                        <Pane
                            name={`${orgunitsPane}-current-marker`}
                            style={{ zIndex: 699 }}
                        >
                            <MarkerComponent
                                item={currentOrgUnit}
                                draggable={currentOption.value === 'edit'}
                                onDragend={newMarker =>
                                    onChangeLocation(newMarker.getLatLng())
                                }
                            />
                        </Pane>
                    )}
                    {hasMarker && currentOption.value === 'edit' && (
                        <Pane
                            name={`${orgunitsPane}-edit-markers`}
                            style={{ zIndex: 699 }}
                        >
                            <MarkerComponent
                                item={currentOrgUnit}
                                draggable={currentOption.value === 'edit'}
                                onDragend={newMarker =>
                                    onChangeLocation(newMarker.getLatLng())
                                }
                            />
                        </Pane>
                    )}
                </Map>
            </InnerDrawer>
        </Grid>
    );
};
