import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from 'react';

import 'leaflet/dist/leaflet.css';
import { useMapContext } from './Context';

const InnerMap = ({ onClick }) => {
    const { shapes } = useMapContext();
    return (
        <>
            {shapes.map(shape => (
                <GeoJSON
                    key={`${shape.id}-${shape.pathOptions.color}`}
                    data={shape.geo_json}
                    onEachFeature={(feature, layer) => {
                        layer.setStyle(shape.pathOptions);
                        layer.on({
                            click: () => onClick(shape),
                        });
                    }}
                />
            ))}
        </>
    );
};

export const MapComponent = ({ onSelectShape }) => {
    const map = useRef();
    const { centeredShape } = useMapContext();

    useEffect(() => {
        if (centeredShape?.getBounds().isValid()) {
            map.current?.leafletElement.fitBounds(centeredShape.getBounds());
        }
        map.current?.leafletElement.setZoom(8);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map.current]);

    if (!centeredShape) {
        return null;
    }

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
