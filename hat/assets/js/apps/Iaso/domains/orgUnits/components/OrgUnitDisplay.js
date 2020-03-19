import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
    Link,
} from '@material-ui/core';

import { textPlaceholder } from '../../../constants/uiConstants';
import {
    redirectTo as redirectToAction,
} from '../../../routing/actions';


const OrgUnitDisplay = ({
    orgUnit,
    redirectTo,
}) => {
    let message = textPlaceholder;
    if (orgUnit) {
        message = orgUnit.name;
        if (orgUnit.org_unit_type_name) {
            message += `(${orgUnit.org_unit_type_name})`;
        }
    }
    return (
        <Link
            size="small"
            onClick={() => redirectTo('orgunits/detail', {
                orgUnitId: orgUnit.id,
            })}
        >
            {message}
        </Link>
    );
};


OrgUnitDisplay.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        redirectTo: redirectToAction,
    }, dispatch),
});

export default connect(() => ({}), MapDispatchToProps)(OrgUnitDisplay);
