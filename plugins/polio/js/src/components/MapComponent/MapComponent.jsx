import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useCallback } from 'react';

import 'leaflet/dist/leaflet.css';
import { useMapContext } from './Context';

const InnerMap = ({ onClick }) => {
    const map = useMap();
    const { shapes, centeredShape } = useMapContext();

    useEffect(() => {
        map.fitBounds(centeredShape.getBounds());
    }, []);

    return (
        <>
            {shapes.map(shape => (
                <GeoJSON
                    key={`${shape.id}`}
                    data={shape.geo_json}
                    pathOptions={shape.pathOptions}
                    eventHandlers={{
                        click() {
                            onClick(shape);
                        },
                    }}
                />
            ))}
        </>
    );
};

export const MapComponent = () => {
    const { centeredShape } = useMapContext();

    const onClick = useCallback(arg => console.log(arg), []);

    if (!centeredShape) {
        return null;
    }

    return (
        <MapContainer
            style={{ height: 500 }}
            center={[0, 0]}
            bounds={centeredShape}
            zoom={5}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <InnerMap onClick={onClick} />
        </MapContainer>
    );
};
