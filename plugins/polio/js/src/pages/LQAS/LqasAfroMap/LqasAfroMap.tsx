import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Map, TileLayer } from 'react-leaflet';
import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { isEqual } from 'lodash';
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
import { defaultViewport } from '../../../components/campaignCalendar/map/constants';
import { MapPanes } from '../../../components/MapComponent/MapPanes';
import { OK_COLOR } from '../../../styles/constants';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useGetCountriesLqasStatus } from './useGetCountriesLqasStatus';

const defaultShapes = [];

type Props = {
    round: 'latest' | string;
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

const getMainLayerStyle = shape => {
    return lqasDistrictColors[shape.status];
};

export const LqasAfroMap: FunctionComponent<Props> = ({ round = 'latest' }) => {
    const { formatMessage } = useSafeIntl();
    // Get all countries shapes
    const map = useRef();
    const [viewport, setViewPort] = useState(defaultViewport);
    // This may be grouped with the statuses hook
    const { data: countries, isFetching: isFetchingCountries } =
        useGetCountriesGeoJson(true);

    const { countriesWithStatus, isFetching } = useGetCountriesLqasStatus({
        countries,
    });
    // console.log('countries', countries);
    // console.log('countriesWithStatus', countriesWithStatus);

    // Determine the point at which we switch to detailed view
    const showCountries = viewport.zoom <= 5;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.calendar)}
                displayBackButton={false}
            />
            <Box position="relative">
                {/* Showing spinner on isFetching alone would make the map seem like it's loading before the user has chosen a country and campaign */}
                {isFetchingCountries && (
                    <LoadingSpinner fixed={false} absolute />
                )}
                <Map
                    zoomSnap={0.25}
                    ref={map}
                    style={{
                        height: '72vh',
                    }}
                    center={viewport.center}
                    zoom={viewport.zoom}
                    scrollWheelZoom={false}
                    onViewportChanged={v => setViewPort(v)}
                >
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {showCountries && (
                        <MapPanes
                            mainLayer={countriesWithStatus}
                            // backgroundLayer={}
                            getMainLayerStyle={getMainLayerStyle}
                            // getBackgroundLayerStyle={}
                            name="LQAS-Map-country-view"
                        />
                    )}
                </Map>
            </Box>
        </>
    );
};
