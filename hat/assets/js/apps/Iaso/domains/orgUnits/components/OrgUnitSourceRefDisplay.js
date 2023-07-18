import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import { Link } from 'react-router';

import { textPlaceholder } from 'bluesquare-components';

const styles = () => ({
    link: {
        cursor: 'pointer',
    },
});

const OrgUnitSourceRefDisplay = ({ orgUnit, classes }) => {
    if (!orgUnit || !orgUnit.source_ref) {
        return textPlaceholder;
    }

    return (
        <Link
            target="_blank"
            className={classes.link}
            href={`${orgUnit.source_url}/api/organisationUnits/${orgUnit.source_ref}`}
        >
            {orgUnit.source_ref}
        </Link>
    );
};

OrgUnitSourceRefDisplay.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(OrgUnitSourceRefDisplay);
