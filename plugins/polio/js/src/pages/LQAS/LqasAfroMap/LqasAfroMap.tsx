import React, { FunctionComponent, useMemo, useRef, useState } from 'react';

import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { MapContainer, useMapEvent } from 'react-leaflet';
import { makePopup } from '../../../components/LQAS-IM/LqasImPopUp';
import {
    determineStatusForDistrict as lqasDistrictStatus,
    makeLqasMapLegendItems,
} from '../utils';
import { lqasDistrictColors, IN_SCOPE } from '../../IM/constants';
import {
    findDataForShape,
    findScopeIds,
    defaultShapeStyle,
} from '../../../utils/index';
import MESSAGES from '../../../constants/messages';
import {
    useGetCountriesGeoJson,
    useGetGeoJson,
} from '../../../hooks/useGetGeoJson';
import TILES from '../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';

import { defaultViewport } from '../../../components/campaignCalendar/map/constants';
import { MapPanes } from '../../../components/MapComponent/MapPanes';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useGetCountriesLqasStatus } from './useGetCountriesLqasStatus';
import { CustomTileLayer } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomTileLayer';
import {
    Tile,
    TilesSwitchDialog,
} from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchDialog';
import { LqasAfroMapPanesContainer } from './LqasAfroMapPanesContainer';

const defaultShapes = [];

type Props = {
    round: 'latest' | string;
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

export const LqasAfroMap: FunctionComponent<Props> = ({ round = 'latest' }) => {
    const { formatMessage } = useSafeIntl();
    // Get all countries shapes
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);

    // This may be grouped with the statuses hook
    const { data: countries, isFetching: isFetchingCountries } =
        useGetCountriesGeoJson(true);

    const { countriesWithStatus, isFetching } = useGetCountriesLqasStatus({
        countries,
    });
    // console.log('countries', countries);
    // console.log('countriesWithStatus', countriesWithStatus);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.calendar)}
                displayBackButton={false}
            />
            <Box position="relative">
                {/* Showing spinner on isFetching alone would make the map seem like it's loading before the user has chosen a country and campaign */}
                {(isFetchingCountries || isFetching) && (
                    <LoadingSpinner fixed={false} absolute />
                )}
                <TilesSwitchDialog
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
                <MapContainer
                    style={{
                        height: '72vh',
                    }}
                    center={defaultViewport.center}
                    zoom={defaultViewport.zoom}
                    scrollWheelZoom={false}
                >
                    <CustomTileLayer currentTile={currentTile} />

                    <LqasAfroMapPanesContainer
                        countriesWithStatus={countriesWithStatus}
                    />
                </MapContainer>
            </Box>
        </>
    );
};
