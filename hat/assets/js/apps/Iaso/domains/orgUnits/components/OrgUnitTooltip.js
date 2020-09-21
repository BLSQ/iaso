import React, { createElement } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
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

const OrgUnitTooltip = ({ orgUnit, children, domComponent }) => {
    const classes = useStyles();
    return (
        <Tooltip
            classes={{ tooltip: classes.root }}
            title={<OrgUnitsSmallInfos orgUnit={orgUnit} />}
            arrow
            enterDelay={500}
            enterNextDelay={500}
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
};

OrgUnitTooltip.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    children: PropTypes.object,
    domComponent: PropTypes.string,
};

export default OrgUnitTooltip;
