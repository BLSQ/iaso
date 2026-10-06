import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Layer, MapLayerMouseEvent, Popup } from '@vis.gl/react-maplibre';
import { useSafeIntl } from 'bluesquare-components';
import isEqual from 'lodash/isEqual';
import type { MapLibreEvent, Map as MapLibreMap$ } from 'maplibre-gl';
import { MapLibreMap, unionBounds } from '../../../../components/maps/maplibre';
import MESSAGES from '../../messages';
import { Search } from '../../types/search';
import {
    ORG_UNIT_TILES_SOURCE_LAYER,
    OrgUnitTilesFilters,
    tileJSONBounds,
} from './orgUnitTiles';
import { SearchResultsLayer } from './SearchResultsLayer';
import {
    anchorLayers,
    POINT_COUNT,
    SEARCH_LAYER_KINDS,
    searchLayerId,
    TILE_META_SOURCE_LAYER,
} from './searchResultsLayers';
import {
    CutTiles,
    SearchResults,
    SearchResultsPanel,
} from './SearchResultsPanel';
import { HoveredOrgUnitName, SearchResultsPopup } from './SearchResultsPopup';
import { searchToV3Filters } from './searchToV3Filters';
import { useOrgUnitTileJSONs } from './useOrgUnitTileJSON';

/** The only tile property: features carry their id, the popups fetch the rest on demand */
const TILE_FIELDS = 'org_unit_type_id';
/** `cluster` of the tiles, in pixels: clusters, or only the points a screen can't tell apart */
const CLUSTER_PX = 48;
const THINNING_PX = 2;
/** `CLUSTER_MAX_ZOOM` of iaso/api/v3/common/mvt.py: no clusters from it */
const CLUSTER_MAX_ZOOM = 15;
/** at most this many org units listed in a click's popup */
const MAX_POPUP_ORG_UNITS = 20;

const sourceId = (index: number) => `search-results-${index}`;

type Hovered = {
    source: string;
    id?: number;
    count?: number;
    longitude: number;
    latitude: number;
};

type Selected = { ids: number[]; longitude: number; latitude: number };

const sameFeature = (a?: Hovered, b?: Hovered) =>
    a?.source === b?.source && a?.id === b?.id && a?.count === b?.count;

const anchors = anchorLayers();

type Props = {
    searches: Search[];
    getSearchColor: (index: number) => string;
    clusters: boolean;
    onClustersChange: (clusters: boolean) => void;
};

/**
 * The results of the org unit searches on a MapLibre map, as vector tiles: one source per search, in its color.
 * No location limit: the tiles hold every result, clustered (or thinned) at low zoom by the server, and the
 * map only asks for the tiles in view. The tiles carry ids only: hovering and clicking fetch what they show.
 */
export const OrgUnitsSearchMapLibre: FunctionComponent<Props> = ({
    searches,
    getSearchColor,
    clusters,
    onClustersChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const [showAll, setShowAll] = useState(false);
    const [hovered, setHovered] = useState<Hovered>();
    const hoveredRef = useRef<Hovered>();
    const [selected, setSelected] = useState<Selected>();
    const [cutTiles, setCutTiles] = useState<Record<string, CutTiles>>({});

    // the searches being created aren't searched yet (as in useGetApiParams), the others keep their color
    const active = useMemo(
        () =>
            searches
                .map((search, index) => ({
                    index,
                    color: getSearchColor(index),
                    ...searchToV3Filters(search),
                }))
                .filter(({ index }) => !searches[index].isAdded),
        [searches, getSearchColor],
    );
    const tileFilters: OrgUnitTilesFilters[] = useMemo(
        () =>
            active.map(({ filters }) => ({
                ...filters,
                fields: TILE_FIELDS,
                cluster: clusters ? CLUSTER_PX : THINNING_PX,
            })),
        [active, clusters],
    );
    const tileJSONQueries = useOrgUnitTileJSONs(tileFilters);
    const tileJSONs = tileJSONQueries.map(query => query.data);

    const bounds = useMemo(
        () =>
            unionBounds(
                tileJSONs.map(
                    tileJSON =>
                        tileJSON &&
                        tileJSONBounds(
                            tileJSON,
                            showAll ? 'bounds' : 'fit_bounds',
                        ),
                ),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [showAll, ...tileJSONs],
    );

    const loadedSources = active
        .filter((_, i) => tileJSONs[i])
        .map(({ index }) => sourceId(index));
    const interactiveLayerIds = useMemo(
        () =>
            loadedSources.flatMap(source =>
                SEARCH_LAYER_KINDS.map(kind => searchLayerId(source, kind)),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [loadedSources.join()],
    );

    /** Highlights `next` (feature-state: the style draws it, nothing re-renders) and shows its tooltip */
    const hover = useCallback((map: MapLibreMap$, next?: Hovered) => {
        const previous = hoveredRef.current;
        if (sameFeature(previous, next)) {
            return;
        }
        [previous, next].forEach((feature, i) => {
            if (feature?.id !== undefined) {
                map.setFeatureState(
                    {
                        source: feature.source,
                        sourceLayer: ORG_UNIT_TILES_SOURCE_LAYER,
                        id: feature.id,
                    },
                    { hover: i === 1 },
                );
            }
        });
        hoveredRef.current = next;
        setHovered(next);
    }, []);

    const handleMouseMove = useCallback(
        (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            hover(
                event.target,
                feature && {
                    source: feature.source,
                    id: feature.id as number | undefined,
                    count: feature.properties?.[POINT_COUNT],
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                },
            );
        },
        [hover],
    );

    const handleMouseLeave = useCallback(
        (event: MapLayerMouseEvent) => hover(event.target),
        [hover],
    );

    const handleClick = useCallback((event: MapLayerMouseEvent) => {
        const features = event.features ?? [];
        if (features.length === 0) {
            return;
        }
        const map = event.target;
        // a cluster on top: zoom in on it, it splits as the tiles get finer
        if (
            features[0].id === undefined &&
            features[0].properties?.[POINT_COUNT]
        ) {
            map.easeTo({
                center: event.lngLat,
                zoom: Math.min(map.getZoom() + 2, CLUSTER_MAX_ZOOM),
            });
            return;
        }
        // the points under the click, all of them (a building drawn twice, a search matching both); else the
        // shapes - a point is always inside some (its area, zone, province...), which aren't what was clicked
        const points = features.filter(
            feature => feature.layer.type === 'circle',
        );
        const ids = [
            ...new Set(
                (points.length > 0 ? points : features)
                    .map(feature => feature.id)
                    .filter((id): id is number => typeof id === 'number'),
            ),
        ].slice(0, MAX_POPUP_ORG_UNITS);
        if (ids.length > 0) {
            setSelected({
                ids,
                longitude: event.lngLat.lng,
                latitude: event.lngLat.lat,
            });
        }
    }, []);

    // a tile holding more than the server's limit has an extra layer saying so: sum it up once the map settles
    const handleIdle = useCallback(
        (event: MapLibreEvent) => {
            const map = event.target;
            const next: Record<string, CutTiles> = {};
            loadedSources.forEach(source => {
                if (!map.getSource(source)) {
                    return;
                }
                const metas = map.querySourceFeatures(source, {
                    sourceLayer: TILE_META_SOURCE_LAYER,
                });
                if (metas.length > 0) {
                    next[source] = metas.reduce(
                        (total, { properties }) => ({
                            kept: total.kept + properties.kept,
                            count: total.count + properties.feature_count,
                        }),
                        { kept: 0, count: 0 },
                    );
                }
            });
            setCutTiles(previous =>
                isEqual(previous, next) ? previous : next,
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [loadedSources.join()],
    );

    const results: SearchResults[] = active.map(
        ({ index, color, unsupported }, i) => ({
            index,
            color,
            unsupported,
            tileJSON: tileJSONs[i],
            isLoading: tileJSONQueries[i].isLoading,
            cut: cutTiles[sourceId(index)],
        }),
    );

    return (
        <MapLibreMap
            bounds={bounds}
            height="75vh"
            interactiveLayerIds={interactiveLayerIds}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onIdle={handleIdle}
        >
            <SearchResultsPanel
                results={results}
                clusters={clusters}
                onClustersChange={onClustersChange}
                showsAll={showAll}
                onShowAllChange={setShowAll}
            />
            {anchors.map(anchor => (
                <Layer key={anchor.id} {...anchor} />
            ))}
            {active.map(({ index, color }, i) => {
                const tileJSON = tileJSONs[i];
                return (
                    tileJSON && (
                        <SearchResultsLayer
                            // new tiles (filters, clusters, cache key): a new source
                            key={tileJSON.tiles[0]}
                            id={sourceId(index)}
                            tileJSON={tileJSON}
                            color={color}
                            clusters={clusters}
                        />
                    )
                );
            })}
            {hovered && !selected && (
                <Popup
                    longitude={hovered.longitude}
                    latitude={hovered.latitude}
                    closeButton={false}
                    closeOnClick={false}
                    anchor="bottom"
                    offset={12}
                >
                    {hovered.id !== undefined ? (
                        <HoveredOrgUnitName id={hovered.id} />
                    ) : (
                        formatMessage(MESSAGES.mapLibreClusterCount, {
                            count: String(hovered.count),
                        })
                    )}
                </Popup>
            )}
            {selected && (
                <Popup
                    longitude={selected.longitude}
                    latitude={selected.latitude}
                    onClose={() => setSelected(undefined)}
                    maxWidth="320px"
                >
                    <SearchResultsPopup ids={selected.ids} />
                </Popup>
            )}
        </MapLibreMap>
    );
};
