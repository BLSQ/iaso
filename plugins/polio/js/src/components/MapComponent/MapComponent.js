/* eslint-disable camelcase */
import { Map, TileLayer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
import React, { useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { geoJSON } from 'leaflet';
import { arrayOf, func, object, objectOf, string } from 'prop-types';

const findBackgroundShape = (shape, backgroundShapes) => {
    return backgroundShapes.filter(
        backgroundShape => backgroundShape.id === shape.parent_id,
    )[0].name;
};
export const MapComponent = ({
    name,
    onSelectShape,
    mainLayer,
    backgroundLayer,
    getMainLayerStyle,
    getBackgroundLayerStyle,
    tooltipLabels,
}) => {
    const map = useRef();

    // When there is no data, bounds is undefined, so default center and zoom is used,
    // when the data get there, bounds change and the effect focus on it via the deps
    const bounds = useMemo(() => {
        if (!mainLayer || mainLayer.length === 0) {
            return null;
        }
        const bounds_list = mainLayer
            .map(orgunit => geoJSON(orgunit.geo_json).getBounds())
            .filter(b => b !== undefined);
        if (bounds_list.length === 0) {
            return null;
        }
        const newBounds = bounds_list[0];
        newBounds.extend(bounds_list);
        return newBounds;
    }, [mainLayer]);

    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.current?.leafletElement.fitBounds(bounds);
        }
    }, [bounds]);

    return (
        <Map
            ref={map}
            style={{ height: 500 }}
            center={[0, 0]}
            zoom={3}
            scrollWheelZoom={false}
            bounds={bounds}
        >
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
                            onClick={() => null}
                        />
                    ))}
            </Pane>
            <Pane name={`MainLayer-${name}`}>
                {mainLayer?.length > 0 &&
                    mainLayer.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getMainLayerStyle(shape)}
                            onClick={() => onSelectShape(shape)}
                        >
                            <Tooltip>
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
            </Pane>
        </Map>
    );
};

MapComponent.propTypes = {
    name: string.isRequired,
    onSelectShape: func,
    mainLayer: arrayOf(object),
    backgroundLayer: arrayOf(object),
    getMainLayerStyle: func,
    getBackgroundLayerStyle: func,
    tooltipLabels: objectOf(string),
};

MapComponent.defaultProps = {
    onSelectShape: () => null,
    mainLayer: [],
    backgroundLayer: [],
    getMainLayerStyle: () => null,
    getBackgroundLayerStyle: () => null,
    tooltipLabels: { main: 'District', background: 'Region' },
};
