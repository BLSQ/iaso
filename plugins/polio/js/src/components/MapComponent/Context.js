import { createContext, useContext } from 'react';
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
});

export const useMapContext = () => useContext(MapContext);

export const MapContainer = ({ shapes = [], onSelectShape }) => {
    return (
        <MapContext.Provider value={{ shapes }}>
                <MapComponent onSelectShape={onSelectShape} />
        </MapContext.Provider>
    );
};
