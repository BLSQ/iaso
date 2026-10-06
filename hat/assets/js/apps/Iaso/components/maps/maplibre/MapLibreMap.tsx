import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    Map,
    MapLayerMouseEvent,
    MapProps,
    NavigationControl,
    ScaleControl,
    useMap,
} from '@vis.gl/react-maplibre';
import { useSkipEffectOnMount } from 'bluesquare-components';
import 'maplibre-gl/dist/maplibre-gl.css';
import tiles from '../../../constants/mapTiles';
import { TilesSwitchControl } from '../tools/TilesSwitchControl';
import { BasemapList } from './BasemapList';
import { Basemap, basemapStyle, DEFAULT_BASEMAP } from './basemaps';
import { Bounds } from './bounds';
import { loadMapLib } from './mapLib';

const FIT_BOUNDS_OPTIONS = { padding: 40, maxZoom: 14 };
const WORLD_VIEW = { longitude: 0, latitude: 0, zoom: 1 };

// Children of <Map> only render once the map is loaded, so `useMap()` is always set here
const FitBoundsOnChange: FunctionComponent<{ bounds?: Bounds }> = ({
    bounds,
}) => {
    const { current: map } = useMap();
    useSkipEffectOnMount(() => {
        if (bounds) {
            map?.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
        }
    }, [JSON.stringify(bounds)]);
    return null;
};

type Props = Omit<MapProps, 'mapStyle' | 'initialViewState' | 'mapLib'> & {
    /** the map is fitted to them, initially and whenever they change */
    bounds?: Bounds;
    height?: number | string;
    children?: ReactNode;
};

/**
 * Iaso's MapLibre map: react-maplibre's `<Map>` with Iaso's defaults (basemaps - the Protomaps vector basemap
 * by default - and their switch, controls, pointer cursor over `interactiveLayerIds`). Every other `<Map>` prop
 * is passed through, and content is added declaratively as `<Source>`/`<Layer>` children, like react-leaflet
 * layers.
 *
 * `maplibre-gl` itself is only loaded when such a map is first rendered (see `loadMapLib`).
 */
export const MapLibreMap: FunctionComponent<Props> = ({
    bounds,
    height = '60vh',
    children,
    onMouseEnter,
    onMouseLeave,
    ...mapProps
}) => {
    const [basemap, setBasemap] = useState<Basemap>(DEFAULT_BASEMAP);
    const mapStyle = useMemo(() => basemapStyle(basemap, tiles), [basemap]);
    const [isHovering, setIsHovering] = useState(false);
    const handleMouseEnter = useCallback(
        (event: MapLayerMouseEvent) => {
            setIsHovering(true);
            onMouseEnter?.(event);
        },
        [onMouseEnter],
    );
    const handleMouseLeave = useCallback(
        (event: MapLayerMouseEvent) => {
            setIsHovering(false);
            onMouseLeave?.(event);
        },
        [onMouseLeave],
    );
    return (
        <Map
            initialViewState={
                bounds
                    ? { bounds, fitBoundsOptions: FIT_BOUNDS_OPTIONS }
                    : WORLD_VIEW
            }
            style={{ width: '100%', height }}
            attributionControl={{ compact: true }}
            cursor={isHovering ? 'pointer' : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...mapProps}
            mapLib={loadMapLib()}
            mapStyle={mapStyle}
        >
            <NavigationControl position="top-left" showCompass={false} />
            <ScaleControl position="bottom-left" />
            <TilesSwitchControl>
                <BasemapList basemap={basemap} onChange={setBasemap} />
            </TilesSwitchControl>
            <FitBoundsOnChange bounds={bounds} />
            {children}
        </Map>
    );
};
