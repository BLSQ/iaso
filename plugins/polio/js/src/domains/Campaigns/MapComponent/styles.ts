import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles(theme => {
    return {
        mapLegendContainer: {
            position: 'absolute',
            zIndex: 499,
            fontSize: 10,
            top: theme.spacing(2),
            right: theme.spacing(2),
        },
        mapLegendTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: theme.spacing(1),
        },
        mapLegend: {
            width: 100,
        },
        roundColor: {
            borderRadius: theme.spacing(3),
            height: theme.spacing(3),
            width: theme.spacing(3),
            border: `2px solid ${theme.palette.ligthGray.border}`,
        },
    };
});
