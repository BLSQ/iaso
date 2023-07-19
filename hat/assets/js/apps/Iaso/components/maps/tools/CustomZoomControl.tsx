import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import { defineMessages } from 'react-intl';

import { useMap } from 'react-leaflet';

import { useSafeIntl } from 'bluesquare-components';

import tiles from '../../../constants/mapTiles';

import { Bounds } from '../../../utils/map/mapUtils';

import './zoom-bar';

type Props = {
    bounds?: Bounds;
    boundsOptions?: Record<string, any>;
    fitOnLoad?: boolean;
};

type ZoomOptions = {
    fitToBounds: () => void;
    fitToBoundsTitle: string;
    position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    zoomBoxTitle: string;
    zoomInfoTitle: string;
};

export const MESSAGES = defineMessages({
    fitToBounds: {
        defaultMessage: 'Center the map',
        id: 'map.label.fitToBounds',
    },
    boxZoomTitle: {
        defaultMessage: 'Draw a square on the map to zoom in to an area',
        id: 'map.label.zoom.box',
    },
    infoZoomTitle: {
        defaultMessage: 'Current zoom level',
        id: 'map.label.zoom.info',
    },
});

export const CustomZoomControl: FunctionComponent<Props> = ({
    bounds,
    boundsOptions = { padding: [10, 10], maxZoom: tiles.osm.maxZoom },
    fitOnLoad = false,
}) => {
    const map: any = useMap();
    const [mapFitted, setMapFitted] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();
    const fitToBounds = useCallback(() => {
        if (bounds) {
            map.fitBounds(bounds, boundsOptions);
        }
    }, [bounds, boundsOptions, map]);
    const context = useLeafletContext();

    L.control.zoom = (opts: ZoomOptions) => new L.Control.Zoom(opts);

    useEffect(() => {
        if (!mapFitted && bounds?.isValid() && fitOnLoad && map) {
            fitToBounds();
            setMapFitted(true);
        }
    }, [fitOnLoad, bounds, mapFitted, fitToBounds, map]);

    useEffect(() => {
        const container = context.layerContainer || context.map;

        const control = L.control.zoom({
            zoomBoxTitle: formatMessage(MESSAGES.boxZoomTitle),
            zoomInfoTitle: formatMessage(MESSAGES.infoZoomTitle),
            fitToBoundsTitle: formatMessage(MESSAGES.fitToBounds),
            fitToBounds,
            position: 'topleft',
        });
        container.addControl(control);

        return () => {
            container.removeControl(control);
        };
    });
    return null;
};
