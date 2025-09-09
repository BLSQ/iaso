import React, { FunctionComponent, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { geoJSON } from 'leaflet';
import { TileLayer, MapContainer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
import { PaneWithPattern } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/PaneWithPattern/PaneWithPattern';
import { CustomZoomControl } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomZoomControl';
import { Shape } from '../Scope/Scopes/types';

const findBackgroundShape = (shape, backgroundShapes) => {
    return backgroundShapes.filter(
        backgroundShape => backgroundShape.id === shape.parent_id,
    )[0]?.name;
};

const boundsOptions = {
    padding: [5, 5],
};

type Props = {
    name: string;
    onSelectShape?: (id: Shape) => void;
    mainLayer?: any[];
    backgroundLayer?: any[];
    getMainLayerStyle?: (shape: any) => Record<string, any>;
    getBackgroundLayerStyle?: (shape: any) => Record<string, any>;
    tooltipLabels?: { main: string; background: string };
    height?: number;
    fitToBounds?: boolean;
    makePopup;
    fitBoundsToBackground?: boolean;
    shapePatterns?: any[];
    shapePatternIds?: any[];
};
export const MapComponent: FunctionComponent<Props> = ({
    name,
    onSelectShape = () => null,
    mainLayer = [],
    backgroundLayer = [],
    getMainLayerStyle = () => null,
    getBackgroundLayerStyle = () => null,
    tooltipLabels = { main: 'District', background: 'Region' },
    height = 500,
    fitToBounds = true,
    makePopup = () => null,
    fitBoundsToBackground = false,
    shapePatterns = [],
    shapePatternIds = [],
}) => {
    // When there is no data, bounds is undefined, so default center and zoom is used,
    // when the data get there, bounds change and the effect focus on it via the deps
    const bounds = useMemo(() => {
        if (!fitToBounds) return null;
        const referenceLayer = fitBoundsToBackground
            ? backgroundLayer
            : mainLayer;
        if (!referenceLayer || referenceLayer.length === 0) {
            return null;
        }
        const bounds_list = referenceLayer
            .map(orgunit => geoJSON(orgunit.geo_json).getBounds())
            .filter(b => b !== undefined);
        if (bounds_list.length === 0) {
            return null;
        }
        const newBounds = bounds_list[0];
        newBounds.extend(bounds_list);
        return newBounds;
    }, [fitToBounds, fitBoundsToBackground, backgroundLayer, mainLayer]);

    return (
        <MapContainer
            key={`${bounds}`}
            style={{ height }}
            center={[0, 0]}
            zoom={3}
            // zoomControl={false}
            scrollWheelZoom={false}
            bounds={bounds}
            boundsOptions={boundsOptions}
            zoomControl={false}
        >
            <CustomZoomControl
                bounds={bounds}
                boundsOptions={boundsOptions}
                fitOnLoad={fitToBounds}
            />
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Pane name={`BackgroundLayer-${name}`}>
                {backgroundLayer?.length > 0 &&
                    backgroundLayer.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getBackgroundLayerStyle(shape)}
                        />
                    ))}
            </Pane>
            <PaneWithPattern
                name={`MainLayer-${name}`}
                key={name}
                patterns={shapePatterns}
                patternIds={shapePatternIds}
            >
                {/* @ts-ignore */}
                {mainLayer?.length > 0 &&
                    mainLayer.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getMainLayerStyle(shape)}
                            eventHandlers={{
                                click: () => onSelectShape(shape),
                            }}
                        >
                            {makePopup && makePopup(shape)}
                            {/* @ts-ignore TODO: fix this type problem */}
                            <Tooltip title={shape.name} pane="popupPane">
                                {backgroundLayer?.length > 0 && (
                                    <span>
                                        {`${
                                            tooltipLabels.background
                                        }: ${findBackgroundShape(
                                            shape,
                                            backgroundLayer,
                                        )} > `}
                                    </span>
                                )}
                                <span>
                                    {`${tooltipLabels.main}: ${shape.name}`}
                                </span>
                            </Tooltip>
                        </GeoJSON>
                    ))}
            </PaneWithPattern>
        </MapContainer>
    );
};
