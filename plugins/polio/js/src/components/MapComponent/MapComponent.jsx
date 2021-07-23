import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from "react";

import 'leaflet/dist/leaflet.css';
import { useMapContext } from './Context';


export const MapComponent = ({ onSelectShape, bounds }) => {
    const map = useRef();
    const { shapes } = useMapContext();

    useEffect(() => {
        if(bounds && bounds.isValid()) {
            map.current?.leafletElement.fitBounds(bounds);
        }
    }, [map.current, bounds]);

    return (
        <Map
            ref={map}
            style={{ height: 500 }}
            center={[0, 0]}
            zoom={3}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {shapes && shapes.map(shape => (
                <GeoJSON
                    key={shape.id}
                    data={shape.geo_json}
                    style={(feature) => shape.pathOptions}
                    onClick={() => onSelectShape(shape)}
                />
            ))}
        </Map>
    );
};
