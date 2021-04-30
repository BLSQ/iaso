import { makeStyles } from '@material-ui/core';
import { Box, Typography } from '@material-ui/core';

import commonStyles from '../../styles/common';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        width: '240px',
        height: '40px',
        borderRight: '1px solid #ccc',
        // boxShadow: 'inset 0 3px 0 0 #3f51b5',
    },
    icon: {
        cursor: 'pointer',
        position: 'relative',
        top: -1,
    },
}));

export const TableHeader = ({ children }) => {
    const classes = useStyles();

    return (
        <Box
            className={classes.root}
            display="flex"
            justifyContent="center"
            alignItems="center"
            component="th"
        >
            <Typography variant="body2" noWrap>
                {children}
            </Typography>
        </Box>
    );
};
