import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, Tooltip, Box } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';

import commonStyles from '../../styles/common';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    icon: {
        cursor: 'pointer',
        position: 'relative',
        top: -1,
    },
}));

const InfoHeaderComponent = ({ message, children }) => {
    const classes = useStyles();
    return (
        <Box
            className={classes.root}
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            <Box display="inline" mr={1}>
                {children}
            </Box>
            <Tooltip
                classes={{ popper: classes.popperFixed }}
                placement="bottom"
                title={message}
            >
                <InfoIcon
                    fontSize="small"
                    color="primary"
                    className={classes.icon}
                />
            </Tooltip>
        </Box>
    );
};

InfoHeaderComponent.propTypes = {
    message: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.string])
        .isRequired,
};
export default InfoHeaderComponent;
