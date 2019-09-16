import { fade } from '@material-ui/core/styles/colorManipulator';

const mapStyles = theme => ({
    mapContainer: {
        height: '70vh',
        marginBottom: theme.spacing(2),
        '& .marker-cluster.primary': {
            backgroundColor: fade(theme.palette.primary.main, 0.6),
        },
        '& .marker-cluster.primary > div': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
        },
        '& .marker-custom.primary span': {
            position: 'relative',
            display: 'block',
            height: '100%',
            width: '100%',
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
    },
});

export default mapStyles;
