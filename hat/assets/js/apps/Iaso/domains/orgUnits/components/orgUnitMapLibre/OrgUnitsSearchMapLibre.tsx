import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Layer, MapLayerMouseEvent, Popup } from '@vis.gl/react-maplibre';
import { useSafeIntl } from 'bluesquare-components';
import isEqual from 'lodash/isEqual';
import type { MapLibreEvent, Map as MapLibreMap$ } from 'maplibre-gl';
import { MapLibreMap, unionBounds } from '../../../../components/maps/maplibre';
import { useGetColors } from '../../../../hooks/useGetColors';
import MESSAGES from '../../messages';
import { Search } from '../../types/search';
import {
    ORG_UNIT_TILES_SOURCE_LAYER,
    OrgUnitTilesFilters,
    tileJSONBounds,
} from './orgUnitTiles';
import {
    hiddenTypesFilter,
    typeColor,
    typeColorExpression,
    typeDepthExpression,
    typeKey,
} from './orgUnitTypeStyle';
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
    LegendType,
    SearchResults,
    SearchResultsPanel,
} from './SearchResultsPanel';
import { HoveredOrgUnitName, SearchResultsPopup } from './SearchResultsPopup';
import { searchToV3Filters } from './searchToV3Filters';
import { useOrgUnitTileJSONs } from './useOrgUnitTileJSON';

/** The only tile property: features carry their id, the popups fetch the rest on demand */
const TILE_FIELDS = 'org_unit_type_id';
/** `cluster` of the tiles, in pixels: clusters, or only the points a screen can't tell apart - when the user
 * picks; else `auto`, the server's pick from the number of results */
const CLUSTER_PX = 48;
const THINNING_PX = 2;
const AUTO_CLUSTER = 'auto';
/** `CLUSTER_MAX_ZOOM` of iaso/api/v3/common/mvt.py: no clusters from it */
const CLUSTER_MAX_ZOOM = 15;
/** at most this many org units listed in a click's popup */
const MAX_POPUP_ORG_UNITS = 20;

const sourceId = (index: number) => `search-results-${index}`;

/** The `cluster` of the tiles: the user's pick, else the server's */
const clusterParam = (clusters?: boolean): string | number => {
    if (clusters === undefined) {
        return AUTO_CLUSTER;
    }
    return clusters ? CLUSTER_PX : THINNING_PX;
};

type Hovered = {
    source: string;
    id?: number;
    count?: number;
    /** of a cluster, when clustered by type */
    typeId?: number | null;
    longitude: number;
    latitude: number;
};

type Selected = { ids: number[]; longitude: number; latitude: number };

const sameFeature = (a?: Hovered, b?: Hovered) =>
    a?.source === b?.source &&
    a?.id === b?.id &&
    a?.count === b?.count &&
    a?.typeId === b?.typeId;

const anchors = anchorLayers();

type Props = {
    searches: Search[];
    getSearchColor: (index: number) => string;
    /** the user's pick - undefined: the server's, from the number of results */
    clusters?: boolean;
    onClustersChange: (clusters: boolean) => void;
};

/**
 * The results of the org unit searches on a MapLibre map, as vector tiles: one source per search. No location
 * limit: the tiles hold every result, clustered (or thinned) at low zoom by the server, and the map only asks for
 * the tiles in view. The tiles carry ids and types only: hovering and clicking fetch what they show.
 *
 * Several searches are each drawn in their color. A single search is drawn by org unit type: a color per type,
 * its clusters split by type, and a legend whose types can be hidden - by filtering the tiles already there.
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
    // the `typeKey`s of the types the legend hides
    const [hiddenTypes, setHiddenTypes] = useState<number[]>([]);
    const { data: palette = [] } = useGetColors(true);

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
    const byType = active.length === 1;
    const tileFilters: OrgUnitTilesFilters[] = useMemo(
        () =>
            active.map(({ filters }) => ({
                ...filters,
                fields: TILE_FIELDS,
                cluster: clusterParam(clusters),
                // clusters keep their type: colored and hidden with it
                cluster_by: byType ? 'org_unit_type_id' : undefined,
            })),
        [active, clusters, byType],
    );
    const tileJSONQueries = useOrgUnitTileJSONs(tileFilters);
    const tileJSONs = tileJSONQueries.map(query => query.data);
    const types = byType ? tileJSONs[0]?.org_unit_types : undefined;

    // a new search shows all its types again
    const searchKey = byType ? JSON.stringify(active[0].filters) : '';
    useEffect(() => setHiddenTypes([]), [searchKey]);

    const typeStyle = useMemo(
        () =>
            types && {
                color: typeColorExpression(types, palette),
                filter: hiddenTypesFilter(hiddenTypes),
                shapeSortKey: typeDepthExpression(types),
            },
        [types, palette, hiddenTypes],
    );
    const legend: LegendType[] | undefined = useMemo(
        () =>
            types?.map(type => ({
                key: typeKey(type.id),
                name: type.name,
                color: typeColor(type.id, palette),
                located_count: type.located_count,
                hidden: hiddenTypes.includes(typeKey(type.id)),
            })),
        [types, palette, hiddenTypes],
    );
    const toggleType = useCallback(
        (key: number) =>
            setHiddenTypes(hidden =>
                hidden.includes(key)
                    ? hidden.filter(other => other !== key)
                    : [...hidden, key],
            ),
        [],
    );
    // the panel shows what the tiles are: the user's pick, else the server's
    const isClustered = (cluster?: number | null) =>
        (cluster ?? 0) > THINNING_PX;
    const showsClusters =
        clusters ?? tileJSONs.some(tileJSON => isClustered(tileJSON?.cluster));

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
                    typeId: feature.properties?.org_unit_type_id ?? null,
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
            legend: byType ? legend : undefined,
        }),
    );
    const hoveredType =
        hovered && types?.find(type => type.id === hovered.typeId);

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
                clusters={showsClusters}
                onClustersChange={onClustersChange}
                onToggleType={toggleType}
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
                            color={typeStyle?.color ?? color}
                            filter={typeStyle?.filter}
                            shapeSortKey={typeStyle?.shapeSortKey}
                            clusters={isClustered(tileJSON.cluster)}
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
                    {hovered.id !== undefined && (
                        <HoveredOrgUnitName id={hovered.id} />
                    )}
                    {hovered.id === undefined &&
                        (hoveredType
                            ? formatMessage(MESSAGES.mapLibreClusterOfType, {
                                  count: String(hovered.count),
                                  type:
                                      hoveredType.name ??
                                      formatMessage(MESSAGES.mapLibreNoType),
                              })
                            : formatMessage(MESSAGES.mapLibreClusterCount, {
                                  count: String(hovered.count),
                              }))}
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
