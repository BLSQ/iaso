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
        },
        '& .marker-custom.primary svg': {
            fill: theme.palette.primary.main,
        },
        '& .marker-custom.primary img': {
            position: 'absolute',
            bottom: 5,
            left: 7,
            zIndex: -1,
        },
    },
});

export default mapStyles;
