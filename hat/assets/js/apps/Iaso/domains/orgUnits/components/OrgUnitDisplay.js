import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { Link } from 'react-router-dom';

import { textPlaceholder } from 'bluesquare-components';
import { OrgUnitLabel } from '../utils';

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
            <OrgUnitLabel orgUnit={orgUnit} withType={withType} />
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
