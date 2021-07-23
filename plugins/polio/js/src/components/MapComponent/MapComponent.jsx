import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from "react";
import 'leaflet/dist/leaflet.css';


export const MapComponent = ({ onSelectShape, bounds, shapes }) => {
    const map = useRef();

    useEffect(() => {
        // When there is no data, bounds is undefined, so default center and zoom is used,
        // when the data get there, bounds change and we use the effect to focus on it
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
            bounds={bounds}
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
