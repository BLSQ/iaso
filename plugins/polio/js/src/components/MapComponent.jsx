import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';

import 'leaflet/dist/leaflet.css';

const InnerMap = ({ orgUnits, bounds }) => {
    const map = useMap();

    useEffect(() => {
        map.fitBounds(bounds);
    }, []);

    return (
        <>
            {orgUnits.map(orgUnit => (
                <GeoJSON key={`${orgUnit.id}`} data={orgUnit.geo_json} />
            ))}
        </>
    );
};

export const MapComponent = ({ orgUnits = [] }) => {
    const mapRef = useRef();

    const bounds = useMemo(() => {
        const firstOrgUnit = orgUnits[0];
        if (firstOrgUnit) return L.geoJSON(firstOrgUnit.geo_json);
    }, [orgUnits]);

    if (!bounds) {
        return null;
    }

    return (
        <MapContainer
            ref={mapRef}
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
            <InnerMap orgUnits={orgUnits} bounds={bounds.getBounds()} />
        </MapContainer>
    );
};
