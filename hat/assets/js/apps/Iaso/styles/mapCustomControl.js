import { theme } from 'bluesquare-components';

export const styles = {
    '[class*="leaflet-control-zoom-"]': {
        fontSize: 14,
        fontWeight: 'bold',
        height: 34,
        lineHeight: 30,
        margin: 0,
        textAlign: 'center',
        width: 34,
    },
    '.leaflet-control-zoom-box img': {
        marginTop: 3,
        marginLeft: 2,
    },
    '.leaflet-control-zoom-fit img': {
        marginTop: 3,
        marginLeft: 2,
    },
    '.leaflet-control-zoom-box.active': {
        background: theme.palette.mediumGray.main,
    },
    '.leaflet-container.leaflet-control-boxzoom-active': {
        cursor: 'crosshair !important',
    },
    '.leaflet-container.leaflet-control-boxzoom-active path.leaflet-interactive':
        {
            cursor: 'crosshair !important',
        },
};
