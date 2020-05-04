
import React from 'react';
import PropTypes from 'prop-types';
import {
    Tooltip,
} from '@material-ui/core';
import OrgUnitsSmallInfos from './OrgUnitsSmallInfos';

const OrgUnitTooltip = ({ orgUnit, children }) => (
    <Tooltip
        title={<OrgUnitsSmallInfos orgUnit={orgUnit} />}
        arrow
        enterDelay={500}
        enterNextDelay={500}
    >
        {children}
    </Tooltip>
);
OrgUnitTooltip.defaultProps = {
    children: null,
};

OrgUnitTooltip.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    children: PropTypes.object,
};


export default OrgUnitTooltip;
