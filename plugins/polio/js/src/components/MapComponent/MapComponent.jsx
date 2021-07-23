import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from 'react';

import 'leaflet/dist/leaflet.css';
import { useMapContext } from './Context';
import { geoJSON } from "leaflet";

const InnerMap = ({ onClick }) => {
    const { shapes } = useMapContext();

    return (
        <>
            {shapes.map(shape => (
                <GeoJSON
                    key={shape.id}
                    data={shape.geo_json}
                    style={(feature) => shape.pathOptions}
                    onClick={() => onClick(shape)}
                />
            ))}
        </>
    );
};

export const MapComponent = ({ onSelectShape }) => {
    const map = useRef();
    const { shapes } = useMapContext();

    useEffect(() => {
        let bounds_list = shapes.map(orgunit => geoJSON(orgunit.geo_json).getBounds()).filter(b=> b !== undefined)
        const bounds = bounds_list[0]
        bounds.extend(bounds_list)
        map.current?.leafletElement.fitBounds(bounds)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map.current]);

    return (
        <Map
            ref={map}
            style={{ height: 500 }}
            center={[0, 0]}
            zoom={10}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <InnerMap onClick={onSelectShape} />
        </Map>
    );
};
