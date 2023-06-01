import React, { FunctionComponent, useMemo, useState } from 'react';
import { useMapEvent } from 'react-leaflet';
import { IN_SCOPE, lqasDistrictColors } from '../../IM/constants';
import { MapPanes } from '../../../components/MapComponent/MapPanes';

type Props = {
    countriesWithStatus: any;
};

const getMainLayerStyle = shape => {
    return lqasDistrictColors[shape.status] ?? lqasDistrictColors[IN_SCOPE];
};

export const LqasAfroMapPanesContainer: FunctionComponent<Props> = ({
    countriesWithStatus,
}) => {
    const map = useMapEvent('zoomend', () => {
        setZoom(map.getZoom());
    });
    const [zoom, setZoom] = useState<number>(map.getZoom());
    const showCountries = zoom <= 5;
    const mainLayer = useMemo(() => {
        if (showCountries) return countriesWithStatus;
        return null;
    }, [countriesWithStatus, showCountries]);

    return (
        <>
            {showCountries && (
                <MapPanes
                    mainLayer={mainLayer}
                    // backgroundLayer={}
                    getMainLayerStyle={getMainLayerStyle}
                    // getBackgroundLayerStyle={}
                    name="LQAS-Map-country-view"
                />
            )}
        </>
    );
};
