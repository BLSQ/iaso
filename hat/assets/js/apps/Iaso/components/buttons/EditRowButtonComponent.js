import React from 'react';
import PropTypes from 'prop-types';
import Edit from '@material-ui/icons/Edit';

import RowButtonComponent from './RowButtonComponent';

function EditRowButtonComponent({ onClick }) {
    return (
        <RowButtonComponent
            onClick={onClick}
            tooltipMessage={{ id: 'iaso.label.edit', defaultMessage: 'Edit' }}
        >
            <Edit />
        </RowButtonComponent>
    );
}
EditRowButtonComponent.propTypes = {
    onClick: PropTypes.func.isRequired,
};
export default EditRowButtonComponent;
