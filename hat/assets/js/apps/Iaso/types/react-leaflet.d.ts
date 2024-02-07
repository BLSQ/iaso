import { CSSProperties } from React;
import 'react-leaflet';
import { GeoJSON as LeafletGeoJSON } from 'leaflet';

declare module 'react-leaflet' {
    export interface TooltipProps {
        permanent?: boolean;
        sticky?: boolean;
        pane?: string;
    }
    export interface GeoJSONProps {
        style?: CSSProperties | ((feature: any) => CSSProperties);
        onEachFeature?: (feature: any, layer: LeafletGeoJSON) => void;
        className?: string;
    }
    export interface TileLayerProps {
        attribution?: string;
        position?:
            | 'topleft'
            | 'topright'
            | 'bottomleft'
            | 'bottomright'
            | 'center';
    }
}
