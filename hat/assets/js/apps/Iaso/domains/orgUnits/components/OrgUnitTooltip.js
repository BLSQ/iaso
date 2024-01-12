import React, { createElement } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import OrgUnitsSmallInfos from './OrgUnitsSmallInfos';

const useStyles = makeStyles(() => ({
    root: {
        maxWidth: 'none',
        minWidth: 180,
    },
    container: {
        cursor: 'pointer',
    },
}));

const OrgUnitTooltip = ({
    orgUnit,
    children,
    domComponent,
    enterDelay,
    enterNextDelay,
}) => {
    const classes = useStyles();
    return (
        <Tooltip
            classes={{ tooltip: classes.root }}
            title={<OrgUnitsSmallInfos orgUnit={orgUnit} />}
            arrow
            enterDelay={enterDelay}
            enterNextDelay={enterNextDelay}
        >
            {createElement(
                domComponent,
                { className: classes.container },
                children,
            )}
        </Tooltip>
    );
};
OrgUnitTooltip.defaultProps = {
    children: null,
    domComponent: 'section',
    enterDelay: 500,
    enterNextDelay: 500,
};

OrgUnitTooltip.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    children: PropTypes.object,
    domComponent: PropTypes.string,
    enterDelay: PropTypes.number,
    enterNextDelay: PropTypes.number,
};

export default OrgUnitTooltip;
