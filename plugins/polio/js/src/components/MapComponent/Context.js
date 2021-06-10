import { createContext, useContext, useMemo } from 'react';
import * as L from 'leaflet';
import { MapComponent } from './MapComponent';

/**
 * Holds the data required by the MapComponent.
 * The value of the context is an array of the
 * shape with it's options.
 *
 * The shape contains the geo information to draw the shape in the canvas.
 * The options contains the style information.
 *
 */
export const MapContext = createContext({
    shapes: [],
    centeredShape: null,
});

export const useMapContext = () => useContext(MapContext);

export const MapContainer = ({ shapes = [], onSelectShape }) => {
    const centeredShape = useMemo(() => {
        const firstShape = shapes[0];
        if (firstShape) return L.geoJSON(firstShape.geo_json);
    }, [shapes]);
    return (
        <MapContext.Provider value={{ shapes, centeredShape }}>
            <MapComponent onSelectShape={onSelectShape} />
        </MapContext.Provider>
    );
};
