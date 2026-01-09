import React, { Fragment, FunctionComponent, useMemo, useState } from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {
    Grid,
    Table,
    Paper,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    useTheme,
} from '@mui/material';
import { useSafeIntl, useGoBack, LoadingSpinner } from 'bluesquare-components';
import { MapContainer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { CustomTileLayer } from 'Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from 'Iaso/components/maps/tools/CustomZoomControl';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import tiles from 'Iaso/constants/mapTiles';
import {
    Bounds,
    circleColorMarkerOptions,
    getOrgUnitsBounds,
    isValidCoordinate,
} from 'Iaso/utils/map/mapUtils';
import getDisplayName from 'Iaso/utils/usersUtils';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPlanningDetails } from '../plannings/hooks/requests/useGetPlanningDetails';
import { useGetPlanningOrgUnits } from '../plannings/hooks/requests/useGetPlanningOrgUnits';
import { Planning } from '../plannings/types';
import { useGetTeam } from '../teams/hooks/requests/useGetTeams';
import { useSaveTeam } from '../teams/hooks/requests/useSaveTeam';
import { useSaveProfile } from '../users/hooks/useSaveProfile';
import MESSAGES from './messages';
import { AssignmentParams } from './types/assigment';
const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};
const boundsOptions = {
    padding: [25, 25],
    maxZoom: 12,
};
const defaultHeight = '80vh';

export const Assignments: FunctionComponent = () => {
    const params: AssignmentParams = useParamsObject(
        baseUrls.assignments,
    ) as unknown as AssignmentParams;
    const { formatMessage } = useSafeIntl();

    const { planningId } = params;
    const {
        data: planning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanningDetails(planningId);

    const goBack = useGoBack(baseUrls.planning);
    const theme = useTheme();
    // Map stuff
    const { data: mapOrgUnits, isLoading: isLoadingMapOrgUnits } =
        useGetPlanningOrgUnits(planningId);
    const rootMapOrgUnit = useMemo(() => {
        return mapOrgUnits?.find(ou => ou.id === planning?.org_unit);
    }, [mapOrgUnits, planning]);
    const otherMapOrgUnits = useMemo(() => {
        return mapOrgUnits?.filter(ou => ou.id !== planning?.org_unit);
    }, [mapOrgUnits, planning]);
    const bounds: Bounds | undefined = useMemo(
        () => mapOrgUnits && getOrgUnitsBounds(mapOrgUnits),
        [mapOrgUnits],
    );
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    // Map stuff
    // Team stuff
    const { data: rootTeam, isLoading: isLoadingRootTeam } = useGetTeam(
        planning?.team,
    );
    const { mutate: updateTeam } = useSaveTeam('edit', false);
    const { mutate: updateUser } = useSaveProfile();
    // Team stuff
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}: ${
                    planning?.name ?? ''
                }`}
                displayBackButton
                goBack={goBack}
            />

            <MainWrapper sx={{ p: 4 }}>
                <>
                    {planning && (
                        <Typography
                            variant="h6"
                            display="flex"
                            alignItems="center"
                        >
                            {planning.org_unit_details?.name}
                            <ChevronRight sx={{ fontSize: 40, px: 1 }} />
                            {planning.target_org_unit_type_details?.name}
                        </Typography>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            {isLoadingMapOrgUnits && <LoadingSpinner />}
                            <MapContainer
                                key={planning?.id}
                                bounds={bounds}
                                maxZoom={currentTile.maxZoom}
                                style={{ height: defaultHeight }}
                                center={defaultViewport.center}
                                zoom={defaultViewport.zoom}
                                scrollWheelZoom={false}
                                zoomControl={false}
                                contextmenu
                                refocusOnMap={false}
                                boundsOptions={boundsOptions}
                            >
                                <CustomZoomControl
                                    bounds={bounds}
                                    boundsOptions={boundsOptions}
                                    fitOnLoad
                                />
                                <ScaleControl imperial={false} />
                                <CustomTileLayer
                                    currentTile={currentTile}
                                    setCurrentTile={setCurrentTile}
                                />
                                {rootMapOrgUnit?.geo_json && (
                                    <Pane
                                        name="root-org-unit-shape"
                                        style={{ zIndex: 200 }}
                                    >
                                        <GeoJSON
                                            key={rootMapOrgUnit?.id}
                                            data={rootMapOrgUnit.geo_json}
                                        />
                                    </Pane>
                                )}
                                <Pane
                                    name="target-org-units-shapes"
                                    style={{ zIndex: 201 }}
                                >
                                    {otherMapOrgUnits
                                        ?.filter(
                                            ou =>
                                                ou.has_geo_json &&
                                                ou.id !== planning?.org_unit,
                                        )
                                        .map(ou => (
                                            <GeoJSON
                                                key={ou.id}
                                                data={ou.geo_json}
                                            />
                                        ))}
                                </Pane>
                                <Pane
                                    name="target-org-units-locations"
                                    style={{ zIndex: 202 }}
                                >
                                    {otherMapOrgUnits
                                        ?.filter(ou =>
                                            isValidCoordinate(
                                                ou.latitude,
                                                ou.longitude,
                                            ),
                                        )
                                        .map(ou => (
                                            <CircleMarkerComponent
                                                key={ou.id}
                                                item={ou}
                                                markerProps={() => ({
                                                    ...circleColorMarkerOptions(
                                                        theme.palette.error
                                                            .main,
                                                    ),
                                                    radius: 12,
                                                })}
                                            />
                                        ))}
                                </Pane>
                            </MapContainer>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            {isLoadingRootTeam && <LoadingSpinner />}
                            <Paper sx={{ height: defaultHeight }}>
                                {rootTeam && (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell colSpan={2}>
                                                    <Typography variant="h6">
                                                        {rootTeam?.name}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rootTeam?.sub_teams_details.map(
                                                subTeam => (
                                                    <TableRow key={subTeam.id}>
                                                        <TableCell
                                                            sx={{ width: 50 }}
                                                        >
                                                            <ColorPicker
                                                                currentColor={
                                                                    subTeam?.color
                                                                }
                                                                displayLabel={
                                                                    false
                                                                }
                                                                onChangeColor={color => {
                                                                    updateTeam({
                                                                        id: subTeam.id,
                                                                        color,
                                                                    });
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {subTeam?.name}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                            {rootTeam?.users_details.map(
                                                user => (
                                                    <TableRow key={user.id}>
                                                        <TableCell
                                                            sx={{ width: 50 }}
                                                        >
                                                            <ColorPicker
                                                                currentColor={
                                                                    user?.color
                                                                }
                                                                displayLabel={
                                                                    false
                                                                }
                                                                onChangeColor={color => {
                                                                    // @ts-ignore
                                                                    updateUser({
                                                                        id: user.id,
                                                                        user_name:
                                                                            user.username,
                                                                        color,
                                                                    });
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {getDisplayName(
                                                                user,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            </MainWrapper>
        </>
    );
};
