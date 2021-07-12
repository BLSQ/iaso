import { alpha } from '@material-ui/core/styles/colorManipulator';

const mapStyles = theme => ({
    mapContainer: {
        height: '62vh',
        marginBottom: theme.spacing(2),
        '& .leaflet-container .leaflet-popup-content a': {
            color: theme.palette.primary.main,
        },
        '& .marker-cluster.color': {
            color: 'white',
        },
        '& .marker-cluster.color div': {
            marginLeft: 2,
            marginTop: 2,
        },
        '& .marker-cluster.color div .border': {
            position: 'absolute',
            display: 'block',
            height: 34,
            width: 34,
            top: -2,
            left: -2,
            borderRadius: '100%',
            zIndex: -1,
        },
        '& .marker-cluster.primary': {
            backgroundColor: alpha(theme.palette.primary.main, 0.6),
        },
        '& .marker-cluster.primary > div': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
        },
        '& .marker-cluster.secondary': {
            backgroundColor: alpha(theme.palette.secondary.main, 0.6),
        },
        '& .marker-cluster.secondary > div': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
        },
        '& .marker-custom': {
            zIndex: '500 !important',
        },
        '& .marker-custom.primary span': {
            position: 'relative',
            display: 'block',
            height: '100%',
            width: '100%',
        },
        '& .marker-custom .marker_bg, & .marker-custom.primary .marker_bg': {
            position: 'absolute',
            display: 'block',
            height: '10px',
            width: '10px',
            borderRadius: '10px',
            backgroundColor: 'white',
            top: 8,
            left: 8,
        },
        '& .marker-custom.color': {
            zIndex: '300 !important',
        },
        '& .marker-custom.color .svg-icon': {
            display: 'block',
            height: 'auto',
            width: 16,
            position: 'absolute',
            top: 6,
            left: 4,
            zIndex: 200,
            borderRadius: '5px',
        },
        '& .marker-custom.color .marker_shadow': {
            position: 'absolute',
            bottom: 2,
            left: -1,
            zIndex: -1,
            pointerEvents: 'none',
        },
        '& .marker-custom.color svg': {
            position: 'absolute',
            bottom: 0,
            left: -5,
            pointerEvents: 'none',
        },
        '& .marker-custom.primary svg': {
            fill: theme.palette.primary.main,
            position: 'absolute',
            bottom: 0,
            left: -5,
            pointerEvents: 'none',
        },
        '& path.primary': {
            fill: alpha(theme.palette.primary.main, 0.6),
            stroke: theme.palette.primary.main,
            strokeOpacity: 1,
            strokeWidth: 3,
        },
        '& path.secondary': {
            fill: alpha(theme.palette.secondary.main, 0.6),
            stroke: theme.palette.secondary.main,
            strokeOpacity: 1,
            strokeWidth: 3,
        },
        '& path.no-pointer-event': {
            pointerEvents: 'none !important',
        },
        '& .marker-custom.primary img': {
            position: 'absolute',
            bottom: 2,
            left: -1,
            zIndex: -1,
            pointerEvents: 'none',
            width: 'auto',
        },
        '& .leaflet-draw.leaflet-control': {
            display: 'none',
        },
    },
});

export default mapStyles;
