import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
    Link, withStyles,
} from '@material-ui/core';

import {
    redirectTo as redirectToAction,
} from '../../../routing/actions';
import { getOrgunitMessage } from '../utils';

const styles = () => ({
    link: {
        cursor: 'pointer',
    },
});

const OrgUnitDisplay = ({
    orgUnit,
    redirectTo,
    classes,
    withType,
}) => (
    <Link
        size="small"
        className={classes.link}
        onClick={() => redirectTo('orgunits/detail', {
            orgUnitId: orgUnit.id,
        })}
    >
        {getOrgunitMessage(orgUnit, withType)}
    </Link>
);

OrgUnitDisplay.defaultProps = {
    withType: true,
};


OrgUnitDisplay.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    withType: PropTypes.bool,
};

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        redirectTo: redirectToAction,
    }, dispatch),
});

export default connect(() => ({}), MapDispatchToProps)(withStyles(styles)(OrgUnitDisplay));
