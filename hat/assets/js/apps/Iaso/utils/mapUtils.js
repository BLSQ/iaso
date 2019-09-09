import L from 'leaflet';

export const isValidCoordinate = (latitude, longitude) => {
    if (
        !latitude
        || !longitude
        || latitude > 90
        || latitude < -90
        || longitude > 180
        || longitude < -180
    ) return false;
    return true;
};

export const getLatLngBounds = (items) => {
    if (items.length === 0) return null;
    const latLngs = [];
    items.forEach((i) => {
        if (isValidCoordinate(i.latitude, i.longitude)) {
            latLngs.push(L.latLng(i.latitude, i.longitude));
        } else if (isValidCoordinate(i[0], i[1])) {
            latLngs.push(L.latLng(i[0], i[1]));
        }
        return null;
    });
    const bounds = L.latLngBounds(latLngs);
    return bounds;
};

export const createClusterCustomIcon = cluster => (L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: 'marker-cluster primary',
    iconSize: L.point(40, 40, true),
})
);
