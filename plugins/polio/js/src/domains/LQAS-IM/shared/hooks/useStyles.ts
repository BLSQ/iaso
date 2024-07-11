import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';

const styles = theme => ({
    ...commonStyles(theme),
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
});

export const useStyles = makeStyles(styles);
