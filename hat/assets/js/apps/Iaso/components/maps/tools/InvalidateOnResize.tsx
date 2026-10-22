import { FC, useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Leaflet only tracks window resizes, not its container being resized by the layout.
export const InvalidateOnResize: FC = () => {
    const map = useMap();
    useEffect(() => {
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(map.getContainer());
        return () => observer.disconnect();
    }, [map]);
    return null;
};
