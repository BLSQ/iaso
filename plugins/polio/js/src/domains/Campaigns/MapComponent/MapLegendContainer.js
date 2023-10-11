import { any } from 'prop-types';
import React from 'react';
import { useStyles } from './styles';

export const MapLegendContainer = ({ children }) => {
    const classes = useStyles();
    return <div className={classes.mapLegendContainer}>{children}</div>;
};

MapLegendContainer.propTypes = {
    children: any,
};

MapLegendContainer.defaultProps = {
    children: null,
};
