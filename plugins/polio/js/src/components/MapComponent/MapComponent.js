import { Map, TileLayer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
import React, { useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { geoJSON } from 'leaflet';

export const MapComponent = ({
    onSelectShape,
    provinceShapes,
    districtShapes,
    getShapeStyle,
}) => {
    const map = useRef();

    // When there is no data, bounds is undefined, so default center and zoom is used,
    // when the data get there, bounds change and the effect focus on it via the deps
    const bounds = useMemo(() => {
        if (!districtShapes || districtShapes.length === 0) {
            return null;
        }
        const bounds_list = districtShapes
            .map(orgunit => geoJSON(orgunit.geo_json).getBounds())
            .filter(b => b !== undefined);
        if (bounds_list.length === 0) {
            return null;
        }
        const newBounds = bounds_list[0];
        newBounds.extend(bounds_list);
        return newBounds;
    }, [districtShapes]);

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
            {districtShapes &&
                districtShapes.map(shape => (
                    <Pane name="Districts">
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getShapeStyle(shape)}
                            onClick={() => onSelectShape(shape)}
                        >
                            <Tooltip>{shape.name}</Tooltip>
                        </GeoJSON>
                    </Pane>
                ))}
            {provinceShapes &&
                provinceShapes.map(shape => (
                    <Pane name="Provinces">
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={{
                                zIndex: 2,
                                color: 'black',
                                opacity: '1',
                                fillColor: 'transparent',
                            }}
                            onClick={() => null}
                        />
                    </Pane>
                ))}
        </Map>
    );
};
