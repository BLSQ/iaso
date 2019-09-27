import { fade } from '@material-ui/core/styles/colorManipulator';

const mapStyles = theme => ({
    mapContainer: {
        height: '62vh',
        marginBottom: theme.spacing(2),
        '& .marker-cluster.primary': {
            backgroundColor: fade(theme.palette.primary.main, 0.6),
        },
        '& .marker-cluster.primary > div': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
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
        '& .marker-custom.primary .marker_bg': {
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
        '& .marker-custom.color > div': {
            width: 40,
            height: 40,
            padding: 5,
        },
        '& .marker-custom.color > div > span': {
            width: 30,
            height: 30,
            display: 'flex',
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
        },
        '& .marker-custom.color .svg-icon': {
            display: 'block',
            height: 'auto',
            width: 22,
        },
        '& .marker-custom.primary svg': {
            fill: theme.palette.primary.main,
            position: 'absolute',
            bottom: 0,
            left: -5,
            pointerEvents: 'none',
        },
        '& .leaflet-overlay-pane path': {
            fill: fade(theme.palette.primary.main, 0.6),
            stroke: theme.palette.primary.main,
        },
        '& .leaflet-draw-guide-dash': {
            backgroundColor: `${theme.palette.primary.main} !important`,
        },
        '& .marker-custom.primary img': {
            position: 'absolute',
            bottom: 2,
            left: -1,
            zIndex: -1,
            pointerEvents: 'none',
        },
        '& .leaflet-draw.leaflet-control': {
            display: 'none',
        },
    },
});

export default mapStyles;
