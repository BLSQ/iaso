/* eslint-disable camelcase */
import { Map, TileLayer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
import React, { useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { geoJSON } from 'leaflet';

const findRegion = (shape, regionShapes) => {
    return regionShapes.filter(
        regionShape => regionShape.id === shape.parent_id,
    )[0].name;
};
export const MapComponent = ({
    onSelectShape,
    districtShapes,
    regionShapes,
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
            <Pane name="Regions">
                {regionShapes &&
                    regionShapes.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={{
                                color: 'grey',
                                opacity: '1',
                                fillColor: 'transparent',
                            }}
                            onClick={() => null}
                        />
                    ))}
            </Pane>
            <Pane name="Districts">
                {districtShapes &&
                    districtShapes.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getShapeStyle(shape)}
                            onClick={() => onSelectShape(shape)}
                        >
                            <Tooltip>
                                <span>{`District: ${shape.name}`} </span>
                                <span>
                                    {`Region: ${findRegion(
                                        shape,
                                        regionShapes,
                                    )}`}{' '}
                                </span>
                            </Tooltip>
                        </GeoJSON>
                    ))}
            </Pane>
        </Map>
    );
};
