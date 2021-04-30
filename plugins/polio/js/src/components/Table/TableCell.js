import { makeStyles, Typography } from '@material-ui/core';
import { Box, Tooltip } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';

import commonStyles from '../../styles/common';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        width: '240px',
        height: '40px',
        borderRight: '1px solid rgba(0,0,0,0.02)',
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
