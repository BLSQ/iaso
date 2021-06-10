import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useEffect, useMemo, useCallback } from 'react';

import 'leaflet/dist/leaflet.css';

const InnerMap = ({ orgUnits, bounds, onClick }) => {
    const map = useMap();

    useEffect(() => {
        map.fitBounds(bounds);
    }, []);

    return (
        <>
            {orgUnits.map(orgUnit => (
                <GeoJSON
                    key={`${orgUnit.id}`}
                    data={orgUnit.geo_json}
                    eventHandlers={{
                        click() {
                            onClick(orgUnit);
                        },
                    }}
                />
            ))}
        </>
    );
};

export const MapComponent = ({ orgUnits = [] }) => {
    const bounds = useMemo(() => {
        const firstOrgUnit = orgUnits[0];
        if (firstOrgUnit) return L.geoJSON(firstOrgUnit.geo_json);
    }, [orgUnits]);
    const onClick = useCallback(arg => console.log(arg), []);

    if (!bounds) {
        return null;
    }

    return (
        <MapContainer
            style={{ height: 500 }}
            center={[0, 0]}
            bounds={bounds}
            zoom={5}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <InnerMap
                orgUnits={orgUnits}
                bounds={bounds.getBounds()}
                onClick={onClick}
            />
        </MapContainer>
    );
};
