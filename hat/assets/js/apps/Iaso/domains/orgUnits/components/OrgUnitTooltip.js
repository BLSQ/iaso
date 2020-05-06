
import React from 'react';
import PropTypes from 'prop-types';
import {
    Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import OrgUnitsSmallInfos from './OrgUnitsSmallInfos';

const useStyles = makeStyles(() => ({
    root: {
        maxWidth: 'none',
        minWidth: 150,
    },
}));

const OrgUnitTooltip = ({ orgUnit, children }) => {
    const classes = useStyles();
    return (
        <Tooltip
            classes={{ tooltip: classes.root }}
            title={<OrgUnitsSmallInfos orgUnit={orgUnit} />}
            arrow
            enterDelay={500}
            enterNextDelay={500}
        >
            {children}
        </Tooltip>
    );
};
OrgUnitTooltip.defaultProps = {
    children: null,
};

OrgUnitTooltip.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    children: PropTypes.object,
};


export default OrgUnitTooltip;
