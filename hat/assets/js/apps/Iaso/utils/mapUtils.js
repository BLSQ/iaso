/* globals STATIC_URL */
import L from 'leaflet';
import { MESSAGES } from '../../../utils/map/mapUtils';

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
    if (latLngs.length === 0) {
        return null;
    }
    const bounds = L.latLngBounds(latLngs);
    return bounds;
};

export const clusterCustomMarker = cluster => (L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: 'marker-cluster primary',
    iconSize: L.point(40, 40, true),
    iconAnchor: [20, 30],
}));

const svgString = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">'
    + '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';

export const customMarkerOptions = {
    className: 'marker-custom primary',
    html: `<span>
        ${L.Util.template(svgString)}
        <img src="${STATIC_URL}images/marker-shadow.png" />
    </span>`,
    iconSize: new L.Point(24, 34),
    popupAnchor: [-1, -35],
    iconAnchor: [12, 32],
};

export const customMarker = L.divIcon(customMarkerOptions);

export const customZoomBar = (formatMessage, fitToBounds) => L.control.zoombar({
    zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
    zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
    fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
    fitToBounds: () => fitToBounds(),
    position: 'topleft',
});
