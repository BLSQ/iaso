import L from 'leaflet';
import setDrawMessages from './drawMapMessages';

export const includeDrawTools = (map, formatMessage, onShapeClick) => {
    map.createPane('custom-draw');
    const shapeOptions = {
        pane: 'custom-draw',
        title: 'super title',
        color: 'blue',
    };
    const shapesLayer = new L.FeatureGroup();
    map.addLayer(shapesLayer);
    const options = {
        position: 'topright',
        draw: {
            polyline: false,
            polygon: {
                shapeOptions,
            },
            circle: {
                shapeOptions,
            },
            marker: false,
            circlemarker: false,
            rectangle: {
                shapeOptions,
            },
        },
        edit: {
            featureGroup: shapesLayer,
            remove: true,
        },
    };
    setDrawMessages(formatMessage);

    map.on(L.Draw.Event.CREATED, e => {
        const { layer } = e;
        shapesLayer.addLayer(layer);
    });

    map.on('draw:created', e => {
        onShapeClick(e.layer);
    });

    shapesLayer.on('click', e => {
        onShapeClick(e.sourceTarget);
    });

    const drawControl = new L.Control.Draw(options);
    map.addControl(drawControl);
};

export const getMarkersInShape = (shape, markers) => {
    const shapeContainLatLng = (latLng, currentShape) =>
        currentShape.getBounds().contains(latLng);
    if (!L.Polygon.contains) {
        L.Polygon.include({
            contains: shapeContainLatLng,
        });
    }

    if (!L.Rectangle.contains) {
        L.Rectangle.include({
            contains: shapeContainLatLng,
        });
    }

    if (!L.Circle.contains) {
        L.Circle.include({
            contains: (latLng, currentShape) =>
                currentShape.getLatLng().distanceTo(latLng) <
                currentShape.getRadius(),
        });
    }

    const includedMarkers = [];
    markers.forEach(marker => {
        if (
            shape.contains(
                {
                    lng: marker.longitude,
                    lat: marker.latitude,
                },
                shape,
            )
        ) {
            includedMarkers.push(marker);
        }
    });
    return includedMarkers;
};
