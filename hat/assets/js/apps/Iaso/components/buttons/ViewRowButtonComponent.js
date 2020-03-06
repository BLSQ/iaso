import React from 'react';
import PropTypes from 'prop-types';
import Edit from '@material-ui/icons/RemoveRedEye';

import RowButtonComponent from './RowButtonComponent';

function ViewRowButtonComponent({ onClick }) {
    return (
        <RowButtonComponent
            onClick={onClick}
            tooltipMessage={{ id: 'iaso.label.view', defaultMessage: 'View' }}
        >
            <Edit />
        </RowButtonComponent>
    );
}
ViewRowButtonComponent.propTypes = {
    onClick: PropTypes.func.isRequired,
};
export default ViewRowButtonComponent;
