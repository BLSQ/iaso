import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core';

const styles = theme => ({
    placeholder: {
        height: 15,
        backgroundColor: theme.palette.ligthGray.main,
        borderRadius: 5,
        marginRight: theme.spacing(1),
        width: '50%',
    },
});

const BlockPlaceholder = ({ classes, width }) => (
    <div
        className={classes.placeholder}
        style={{
            width,
        }}
    />
);

BlockPlaceholder.defaultProps = {
    width: '50%',
};

BlockPlaceholder.propTypes = {
    classes: PropTypes.object.isRequired,
    width: PropTypes.string,
};

export default withStyles(styles)(BlockPlaceholder);
