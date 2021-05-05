import { makeStyles, Typography } from '@material-ui/core';
import { Box } from '@material-ui/core';
import classnames from 'classnames';

import commonStyles from '../../styles/common';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        flex: 1,
        height: '68px',
        border: '1px solid rgba(0,0,0,0.02)',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    odd: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
}));

export const TableCell = ({ children, isOdd }) => {
    const classes = useStyles();

    return (
        <Box
            className={classnames({
                [classes.root]: true,
                [classes.odd]: isOdd,
            })}
            display="flex"
            justifyContent="center"
            alignItems="center"
            component="td"
        >
            <Typography variant="body2" noWrap>
                {children.props.value ? children : '-'}
            </Typography>
        </Box>
    );
};
