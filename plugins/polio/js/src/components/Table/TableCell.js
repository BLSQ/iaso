import { makeStyles, Typography } from '@material-ui/core';
import { Box } from '@material-ui/core';

import commonStyles from '../../styles/common';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        flex: 1,
        height: '68px',
        border: '1px solid rgba(0,0,0,0.02)',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
}));

export const TableCell = ({ children }) => {
    const classes = useStyles();

    return (
        <Box
            className={classes.root}
            display="flex"
            justifyContent="center"
            alignItems="center"
            component="td"
        >
            <Typography variant="body2" noWrap>
                {children}
            </Typography>
        </Box>
    );
};
