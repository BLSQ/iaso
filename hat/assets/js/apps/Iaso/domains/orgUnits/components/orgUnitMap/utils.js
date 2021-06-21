export const zoom = 5;
export const padding = [75, 75];

export const editablePanes = ['location', 'catchment'];

export const resetIndex = map => {
    editablePanes.forEach(paneKey => {
        const pane = map.getPane(`custom-shape-${paneKey}`);
        pane.style.zIndex = 400;
    });
};

export const setToFront = (map, keyName) => {
    editablePanes.forEach(paneKey => {
        const pane = map.getPane(`custom-shape-${paneKey}`);
        if (paneKey === keyName) {
            pane.style.zIndex = 650;
        } else {
            pane.style.zIndex = 400;
        }
    });
};

export const getGeoJson = group => {
    if (group.getLayers().length === 0) return null;
    const geojsonData = group.toGeoJSON();
    const multiPolygon = {
        type: 'MultiPolygon',
        coordinates: [],
        properties: {},
    };
    const { features } = group.toGeoJSON();
    features.forEach(feature => {
        multiPolygon.coordinates.push([feature.geometry.coordinates[0]]);
    });
    geojsonData.features = [
        {
            type: 'Feature',
            properties: {},
            geometry: multiPolygon,
        },
    ];
    geojsonData.features[0].geometry = multiPolygon;
    return geojsonData;
};
