const arcgisPattern =
    'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg';
const tiles = {
    osm: {
        maxZoom: 18,
        url: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
        attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    },
    'arcgis-street': {
        maxZoom: 18,
        url: arcgisPattern.replace('{}', 'World_Street_Map'),
    },
    'arcgis-satellite': {
        maxZoom: 17,
        url: arcgisPattern.replace('{}', 'World_Imagery'),
    },
    'arcgis-topo': {
        maxZoom: 16,
        url: arcgisPattern.replace('{}', 'World_Topo_Map'),
    },
};

export default tiles;
