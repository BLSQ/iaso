import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import { Link } from 'react-router';

import { getOrgunitMessage } from '../utils';
import { textPlaceholder } from '../../../constants/uiConstants';

const styles = () => ({
    link: {
        cursor: 'pointer',
    },
});

const OrgUnitDisplay = ({ orgUnit, classes, withType }) => {
    if (!orgUnit) {
        return textPlaceholder;
    }
    return (
        <Link
            target="_blank"
            className={classes.link}
            href={`/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}`}
        >
            {getOrgunitMessage(orgUnit, withType)}
        </Link>
    );
};

OrgUnitDisplay.defaultProps = {
    withType: true,
};

OrgUnitDisplay.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    withType: PropTypes.bool,
};

export default withStyles(styles)(OrgUnitDisplay);
