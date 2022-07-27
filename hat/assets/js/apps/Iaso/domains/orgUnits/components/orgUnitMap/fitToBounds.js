import L from 'leaflet';
import { mapOrgUnitByLocation } from '../../../../utils/mapUtils';

const fitToBounds = ({
    padding,
    currentTile,
    orgUnit,
    orgUnitTypesSelected,
    sourcesSelected,
    formsSelected,
    editLocationEnabled,
    locationGroup,
    catchmentGroup,
    map,
    ancestorWithGeoJson,
}) => {
    if (map) {
        const mappedOrgUnitTypesSelected = mapOrgUnitByLocation(
            orgUnitTypesSelected || [],
        );
        const mappedSourcesSelected = mapOrgUnitByLocation(
            sourcesSelected || [],
        );

        const groups = [];
        const locations = [];
        let shapesBounds;
        if (ancestorWithGeoJson) {
            const tempBounds = L.geoJSON(ancestorWithGeoJson.geo_json);
            shapesBounds = tempBounds.getBounds();
        }
        mappedOrgUnitTypesSelected.forEach(ot => {
            ot.orgUnits.locations.forEach(o => {
                locations.push(L.latLng(o.latitude, o.longitude));
            });
            ot.orgUnits.shapes.forEach(o => {
                const tempBounds = L.geoJSON(o.geo_json);
                if (shapesBounds) {
                    shapesBounds = shapesBounds.extend(tempBounds.getBounds());
                } else {
                    shapesBounds = tempBounds.getBounds();
                }
            });
        });

        mappedSourcesSelected.forEach(s => {
            s.orgUnits.locations.forEach(o => {
                locations.push(L.latLng(o.latitude, o.longitude));
            });
            s.orgUnits.shapes.forEach(o => {
                const tempBounds = L.geoJSON(o.geo_json);
                if (shapesBounds) {
                    shapesBounds = shapesBounds.extend(tempBounds.getBounds());
                } else {
                    shapesBounds = tempBounds.getBounds();
                }
            });
        });
        if (!editLocationEnabled && formsSelected) {
            formsSelected.forEach(f => {
                f.instances.forEach(i => {
                    locations.push(L.latLng(i.latitude, i.longitude));
                });
            });
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
                maxZoom: 10,
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
