import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { MapContainer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import 'leaflet-draw';
import pink from '@mui/material/colors/pink';
import { Grid, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import {
    mapOrgUnitByLocation,
    getleafletGeoJson,
    orderOrgUnitTypeByDepth,
    isValidCoordinate,
} from '../../../../../utils/map/mapUtils';
import EditOrgUnitOptionComponent from '../EditOrgUnitOptionComponent';
import OrgunitOptionSaveComponent from '../../OrgunitOptionSaveComponent';
import FormsFilterComponent from '../../../../forms/components/FormsFilterComponent';
import OrgUnitTypeFilterComponent from '../../../../forms/components/OrgUnitTypeFilterComponent';
import SourcesFilterComponent from '../../SourcesFilterComponent';
import InnerDrawer from '../../../../../components/nav/InnerDrawer';
import { MapLegend } from '../../../../../components/maps/MapLegend';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';
import setDrawMessages from '../../../../../utils/map/drawMapMessages';
import { OrgUnitsMapComments } from '../OrgUnitsMapComments';
import MESSAGES from '../../../messages';

import 'leaflet-draw/dist/leaflet.draw.css';
import { useGetBounds } from './useGetBounds';
import { userHasPermission } from '../../../../users/utils';
import { useCurrentUser } from '../../../../../utils/usersUtils';
import { useFormState } from '../../../../../hooks/form';
import { getAncestorWithGeojson, initialState } from './utils';
import { useRedux } from './useRedux';
import { MappedOrgUnit } from './types';
import { SourcesSelectedShapes } from './SourcesSelectedShapes';
import { OrgUnitTypesSelectedShapes } from './OrgUnitTypesSelectedShapes';
import { FormsMarkers } from './FormsMarkers';
import { CurrentOrgUnitMarker } from './CurrentOrgUnitMarker';
import { SelectedMarkers } from './SelectedMarkers';
import { buttonsInitialState } from './constants';
import { CustomTileLayer } from '../../../../../components/maps/tools/CustomTileLayer';
import { Tile } from '../../../../../components/maps/tools/TilesSwitchControl';
import tiles from '../../../../../constants/mapTiles';
import { CustomZoomControl } from '../../../../../components/maps/tools/CustomZoomControl';
import * as Permission from '../../../../../utils/permissions';

export const zoom = 5;
export const padding = [75, 75];
export const clusterSize = 25;
export const orgunitsPane = 'org-units';

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
    // eslint-disable-next-line no-unused-vars
    setOrgUnitLocationModified: (isModified: boolean) => void;
    // eslint-disable-next-line no-unused-vars
    onChangeShape: (key, geoJson) => void;
    // eslint-disable-next-line no-unused-vars
    onChangeLocation: (location) => void;
    sources: any[];
    orgUnitTypes: any[];
    orgUnitLocationModified: boolean;
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
    setOrgUnitLocationModified,
    onChangeLocation,
    onChangeShape,
    orgUnitLocationModified,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    const currentUser = useCurrentUser();
    const map: any = useRef();
    // These 2 refs are needed because we need to initialize the EditableGroups only once, but we need the map to be ready
    // and we can't predict exactly how many renders that will require
    const didLocationInitialize = useRef(false);
    const didCatchmentInitialize = useRef(false);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const [isCreatingMarker, setIsCreatingMarker] = useState<boolean>(false);
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const [state, setStateField, _, setState] = useFormState(
        initialState(currentUser),
    );
    const { fetchInstanceDetail, fetchSubOrgUnitDetail } = useRedux();
    // console.log('state', state);
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
        const mapToReset = map.current;
        state.locationGroup.value.reset(mapToReset);
        state.catchmentGroup.value.reset(mapToReset);
        setIsCreatingMarker(false);
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
    const bounds = useGetBounds({
        orgUnit: currentOrgUnit,
        locationGroup: state.locationGroup.value,
        catchmentGroup: state.catchmentGroup.value,
        ancestorWithGeoJson: state.ancestorWithGeoJson.value,
    });

    const toggleEditShape = useCallback(
        keyName => {
            const editEnabled = state[keyName].value.edit;
            const leafletMap = map.current;
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
            const leafletMap = map.current;
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
            const leafletMap = map.current;
            if (keyName === 'location') {
                state.locationGroup.value.addShape(
                    leafletMap,
                    'primary',
                    theme,
                );
            }
            if (keyName === 'catchment') {
                state.catchmentGroup.value.addShape(
                    leafletMap,
                    'secondary',
                    theme,
                );
            }
            toggleAddShape(keyName);
        },
        [
            state.catchmentGroup.value,
            state.locationGroup.value,
            theme,
            toggleAddShape,
        ],
    );

    const handleFormFilter = useCallback(
        forms => {
            setStateField('formsSelected', forms);
        },
        [setStateField],
    );

    const updateOrgUnitLocation = useCallback(
        newOrgUnit => {
            const { latitude, longitude, altitude } = newOrgUnit;
            if (isValidCoordinate(latitude, longitude)) {
                onChangeLocation({
                    latitude,
                    longitude,
                    altitude,
                });
            } else if (newOrgUnit.has_geo_json) {
                setOrgUnitLocationModified(false); // What's the right value, the initial code passed nothing
                onChangeShape('geo_json', newOrgUnit.geo_json);
            }
        },
        [onChangeShape, onChangeLocation, setOrgUnitLocationModified],
    );

    const hasMarker =
        !Number.isNaN(currentOrgUnit.latitude) &&
        !Number.isNaN(currentOrgUnit.longitude);

    if (map.current) {
        map.current.options.maxZoom = currentTile.maxZoom;
    }
    const mappedOrgUnitTypesSelected: MappedOrgUnit[] = useMemo(
        () =>
            mapOrgUnitByLocation(
                orderOrgUnitTypeByDepth(state.orgUnitTypesSelected.value) || [],
            ),
        [state.orgUnitTypesSelected.value],
    );
    const mappedSourcesSelected: MappedOrgUnit[] = useMemo(
        () => mapOrgUnitByLocation(sourcesSelected || []),
        [sourcesSelected],
    );

    const actionBusy =
        state.location.value.edit ||
        state.location.value.delete ||
        state.location.value.add ||
        state.catchment.value.edit ||
        state.catchment.value.delete ||
        state.catchment.value.add;

    useEffect(() => {
        setDrawMessages(formatMessage);
        // This effect should only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // update changes function in EditableGroup as it has been initalized with first state off current org unit
    useSkipEffectOnMount(() => {
        state.locationGroup.value.updateChanges(
            shape => onChangeShape('geo_json', shape),
            onChangeLocation,
        );
        state.catchmentGroup.value.updateChanges(
            shape => onChangeShape('catchment', shape),
            onChangeLocation,
        );
    }, [onChangeLocation, onChangeShape]);

    useEffect(() => {
        if (
            !didLocationInitialize.current &&
            map.current &&
            state.locationGroup.value
        ) {
            state.locationGroup.value.initialize({
                map: map.current,
                groupKey: 'location',
                onChangeShape: shape => onChangeShape('geo_json', shape),
                onChangeLocation,
                geoJson: getleafletGeoJson(currentOrgUnit.geo_json),
                classNames: 'primary',
                onAddShape: () => toggleAddShape('location'),
                onAddMarker: () => setIsCreatingMarker(false),
            });
            didLocationInitialize.current = true;
        }
    });
    useEffect(() => {
        if (
            !didCatchmentInitialize.current &&
            map.current &&
            state.catchmentGroup.value
        ) {
            state.catchmentGroup.value.initialize({
                map: map.current,
                groupKey: 'catchment',
                onChangeShape: shape => onChangeShape('catchment', shape),
                onChangeLocation,
                geoJson: getleafletGeoJson(currentOrgUnit.catchment),
                classNames: 'secondary',
                tooltipMessage: formatMessage(MESSAGES.catchment),
                onAddShape: () => toggleAddShape('catchment'),
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
        state.locationGroup.value.updateShape(
            getleafletGeoJson(currentOrgUnit.geo_json),
            'primary',
        );
    }, [currentOrgUnit.geo_json]);

    // ComponentWillUnmount
    useEffect(() => {
        const currentMap = map.current;
        return () => {
            if (currentMap) {
                state.locationGroup.value.reset(currentMap);
                state.catchmentGroup.value.reset(currentMap);
                setState(initialState(currentUser));
            }
        };
    }, [
        currentUser,
        setState,
        state.catchmentGroup.value,
        state.locationGroup.value,
    ]);

    const { latitude, longitude } = currentOrgUnit;
    // one has a value and the other not or both have a value but are impossible
    const isInvalidCoordinate =
        (latitude === null && longitude !== null) ||
        (longitude === null && latitude !== null) ||
        (latitude !== null &&
            longitude !== null &&
            !isValidCoordinate(latitude, longitude));
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
                        saveDisabled={
                            actionBusy ||
                            !orgUnitLocationModified ||
                            isInvalidCoordinate
                        }
                        saveOrgUnit={saveOrgUnit}
                    />
                }
                filtersOptionComponent={
                    <>
                        <SourcesFilterComponent
                            loadingSelectedSources={loadingSelectedSources}
                            currentOrgUnit={currentOrgUnit}
                            currentSources={sources}
                            sourcesSelected={sourcesSelected}
                            setSourcesSelected={setSourcesSelected}
                        />
                        <OrgUnitTypeFilterComponent
                            currentOrgUnit={currentOrgUnit}
                            orgUnitTypes={orgUnitTypes}
                            orgUnitTypesSelected={
                                state.orgUnitTypesSelected.value
                            }
                            setOrgUnitTypesSelected={outypes => {
                                setStateField('orgUnitTypesSelected', outypes);
                            }}
                        />
                        {userHasPermission(
                            Permission.SUBMISSIONS,
                            currentUser,
                        ) && (
                            <FormsFilterComponent
                                currentOrgUnit={currentOrgUnit}
                                formsSelected={state.formsSelected.value}
                                setFormsSelected={handleFormFilter}
                            />
                        )}
                    </>
                }
                editOptionComponent={
                    <EditOrgUnitOptionComponent
                        orgUnit={currentOrgUnit}
                        canEditLocation={state.canEditLocation.value}
                        canEditCatchment={state.canEditCatchment.value}
                        locationState={state.location.value}
                        catchmentState={state.catchment.value}
                        toggleEditShape={keyValue => toggleEditShape(keyValue)}
                        toggleDeleteShape={keyValue =>
                            toggleDeleteShape(keyValue)
                        }
                        isCreatingMarker={isCreatingMarker}
                        toggleAddShape={keyValue => toggleAddShape(keyValue)}
                        toggleAddMarker={() => {
                            setIsCreatingMarker(!isCreatingMarker);
                            state.locationGroup.value.toggleDrawMarker(
                                !isCreatingMarker,
                            );
                        }}
                        addShape={shapeType => addShape(shapeType)}
                        onChangeLocation={latLong => {
                            setIsCreatingMarker(false);
                            onChangeLocation(latLong);
                        }}
                    />
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
                    bottom={24}
                    top="auto"
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
                <MapContainer
                    key={currentOrgUnit.id}
                    // @ts-ignore TODO: fix this type problem
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    center={[0, 0]}
                    boundsOptions={{ padding }}
                    bounds={bounds}
                    zoom={zoom}
                    zoomControl={false}
                    keyboard={false}
                    whenCreated={mapInstance => {
                        map.current = mapInstance;
                    }}
                >
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={{ padding }}
                        fitOnLoad
                    />
                    <ScaleControl imperial={false} />
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    {!state.location.value.edit &&
                        state.ancestorWithGeoJson.value && (
                            <Pane
                                name="parent-shape"
                                style={{
                                    zIndex: 350,
                                }}
                            >
                                <GeoJSON
                                    data={
                                        state.ancestorWithGeoJson.value.geo_json
                                    }
                                    // @ts-ignore TODO: fix this type problem
                                    style={() => ({
                                        color: pink['300'],
                                    })}
                                >
                                    <OrgUnitPopupComponent
                                        titleMessage={formatMessage(
                                            MESSAGES.ouParent,
                                        )}
                                        currentOrgUnit={
                                            state.ancestorWithGeoJson.value
                                        }
                                    />
                                </GeoJSON>
                            </Pane>
                        )}
                    {!state.location.value.edit && (
                        // Shapes section. Shapes come first so the markers are rendered above them
                        <>
                            <SourcesSelectedShapes
                                mappedSourcesSelected={mappedSourcesSelected}
                                updateOrgUnitLocation={updateOrgUnitLocation}
                                fetchSubOrgUnitDetail={fetchSubOrgUnitDetail}
                            />
                            <OrgUnitTypesSelectedShapes
                                orgUnitTypes={orgUnitTypes}
                                mappedOrgUnitTypesSelected={
                                    mappedOrgUnitTypesSelected
                                }
                                mappedSourcesSelected={mappedSourcesSelected}
                                fetchSubOrgUnitDetail={fetchSubOrgUnitDetail}
                                updateOrgUnitLocation={updateOrgUnitLocation}
                            />
                        </>
                    )}
                    {/* Markers section  */}
                    <>
                        <SelectedMarkers
                            data={mappedOrgUnitTypesSelected}
                            fetchSubOrgUnitDetail={fetchSubOrgUnitDetail}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                        <SelectedMarkers
                            data={mappedSourcesSelected}
                            fetchSubOrgUnitDetail={fetchSubOrgUnitDetail}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />

                        <FormsMarkers
                            forms={state.formsSelected.value}
                            fetchInstanceDetail={fetchInstanceDetail}
                            updateOrgUnitLocation={updateOrgUnitLocation}
                        />
                    </>
                    {hasMarker && (
                        <CurrentOrgUnitMarker
                            isEdit={state.currentOption.value === 'edit'}
                            onChangeLocation={onChangeLocation}
                            currentOrgUnit={currentOrgUnit}
                        />
                    )}
                </MapContainer>
            </InnerDrawer>
        </Grid>
    );
};
