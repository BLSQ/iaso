import L from 'leaflet';

const fitToBounds = ({
    padding,
    currentTile,
    orgUnit,
    locationGroup,
    catchmentGroup,
    map,
    ancestorWithGeoJson,
}) => {
    if (map) {
        const groups = [];
        const locations = [];
        let shapesBounds;
        if (ancestorWithGeoJson) {
            const tempBounds = L.geoJSON(ancestorWithGeoJson.geo_json);
            shapesBounds = tempBounds.getBounds();
        }

        const locationsBounds = L.latLngBounds(locations);
        const otherBounds = locationsBounds.extend(shapesBounds);
        if (orgUnit.geo_json) {
            groups.push(locationGroup.group);
        }
        if (orgUnit.catchment) {
            groups.push(catchmentGroup.group);
        }
        const group = new L.FeatureGroup(groups);
        if (orgUnit.latitude && orgUnit.longitude) {
            const latlng = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
            let bounds = L.latLngBounds(latlng);
            if (groups.length > 0) {
                const groupBounds = group.getBounds();
                bounds = groupBounds.extend(bounds);
            }
            bounds = otherBounds.extend(bounds);
            map.fitBounds(bounds, {
                maxZoom: currentTile.maxZoom,
                padding,
                animate: false,
            });
        } else if (groups.length > 0) {
            let bounds = group.getBounds();
            bounds = otherBounds.extend(bounds);
            map.fitBounds(bounds, {
                maxZoom: currentTile.maxZoom,
                padding,
                animate: false,
            });
        } else if (otherBounds._southWest) {
            map.fitBounds(otherBounds, {
                maxZoom: currentTile.maxZoom,
                padding,
                animate: false,
            });
        }
    }
};
export default fitToBounds;
