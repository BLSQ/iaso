import React, { FunctionComponent, ReactNode } from 'react';
import { useStyles } from './styles';

type Props = {
    children?: ReactNode;
};

export const MapLegendContainer: FunctionComponent<Props> = ({ children }) => {
    const classes = useStyles();
    return <div className={classes.mapLegendContainer}>{children}</div>;
};
