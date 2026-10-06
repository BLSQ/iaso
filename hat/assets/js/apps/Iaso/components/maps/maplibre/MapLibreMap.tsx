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
    ScaleControl,
    useMap,
} from '@vis.gl/react-maplibre';
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import 'maplibre-gl/dist/maplibre-gl.css';
import tiles from '../../../constants/mapTiles';
import MESSAGES from '../messages';
import { TilesSwitchControl } from '../tools/TilesSwitchControl';
import { BasemapList } from './BasemapList';
import { Basemap, basemapStyle, DEFAULT_BASEMAP } from './basemaps';
import { Bounds, FIT_BOUNDS_OPTIONS } from './bounds';
import {
    BoxZoomButton,
    FitBoundsButton,
    FitTarget,
    FullscreenButton,
    MapControlGroup,
    ZoomButtons,
} from './MapControls';
import { loadMapLib } from './mapLib';

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
    /** what the "fit" button offers, `bounds` by default */
    fitTargets?: FitTarget[];
    /** more `MapControlButton`s, after the map's own, before fullscreen */
    controls?: ReactNode;
    height?: number | string;
    children?: ReactNode;
};

/**
 * Iaso's MapLibre map: react-maplibre's `<Map>` with Iaso's defaults (basemaps - the Protomaps vector basemap
 * by default - and their switch, controls (zoom, box zoom, fit, fullscreen, scale, and `controls`), pointer
 * cursor over `interactiveLayerIds`). Every other `<Map>` prop is passed through, and content is added
 * declaratively as `<Source>`/`<Layer>` children, like react-leaflet layers.
 *
 * `maplibre-gl` itself is only loaded when such a map is first rendered (see `loadMapLib`).
 */
export const MapLibreMap: FunctionComponent<Props> = ({
    bounds,
    fitTargets,
    controls,
    height = '60vh',
    children,
    onMouseEnter,
    onMouseLeave,
    ...mapProps
}) => {
    const { formatMessage } = useSafeIntl();
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
            <MapControlGroup position="top-left">
                <ZoomButtons />
                <BoxZoomButton />
                <FitBoundsButton
                    targets={
                        fitTargets ?? [
                            {
                                key: 'bounds',
                                label: formatMessage(MESSAGES.fitToBounds),
                                bounds,
                            },
                        ]
                    }
                />
                {controls}
                <FullscreenButton />
            </MapControlGroup>
            <ScaleControl position="bottom-left" />
            <TilesSwitchControl>
                <BasemapList basemap={basemap} onChange={setBasemap} />
            </TilesSwitchControl>
            <FitBoundsOnChange bounds={bounds} />
            {children}
        </Map>
    );
};
