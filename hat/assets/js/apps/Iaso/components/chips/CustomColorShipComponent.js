import React from 'react';
import { Chip, withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import Cancel from '@material-ui/icons/Cancel';

const styles = () => ({
    icon: {
        '&:hover': {
            filter: 'brightness(60%)',
        },
    },
});

const CustomColorShipComponent = ({
    color,
    isSelected,
    chipProps,
    classes,
}) => {
    const deleteIconStyle = {
        fill: isSelected ? color : 'inherit',
    };
    return (
        <Chip
            {...chipProps}
            style={{
                backgroundColor: isSelected ? 'white' : color,
                color: !isSelected ? 'white' : color,
                border: `1px solid ${color}`,
            }}
            deleteIcon={
                <Cancel
                    style={isSelected ? deleteIconStyle : {}}
                    className={classes.icon}
                />
            }
        />
    );
};

CustomColorShipComponent.defaultProps = {
    isSelected: false,
    color: 'transparent',
};

CustomColorShipComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    color: PropTypes.string,
    isSelected: PropTypes.bool,
    chipProps: PropTypes.object.isRequired,
};

export default withStyles(styles)(CustomColorShipComponent);
