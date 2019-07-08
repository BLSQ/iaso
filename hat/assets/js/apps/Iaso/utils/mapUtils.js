import L from 'leaflet';

export const isValidCoordinate = (latitude, longitude) => {
    if (
        latitude > 90
        || latitude < -90
        || longitude > 180
        || longitude < -180
    ) return false;
    return true;
};

export const getLatLngBounds = (items) => {
    if (items.length === 0) return null;
    const latLngs = items.forEach((i) => {
        if (isValidCoordinate(i.latitude, i.longitude)) {
            return L.latLng(i.latitude, i.longitude);
        }
        return null;
    });
    const bounds = L.latLngBounds(latLngs);
    return bounds;
};
