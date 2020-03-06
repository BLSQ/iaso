import React from 'react';
import PropTypes from 'prop-types';
import Delete from '@material-ui/icons/Delete';

import RowButtonComponent from './RowButtonComponent';

function DeleteRowButtonComponent({ disabled, openDialog }) {
    return (
        <RowButtonComponent
            onClick={openDialog}
            disabled={disabled}
            tooltipMessage={{ id: 'iaso.label.delete', defaultMessage: 'Delete' }}
        >
            <Delete />
        </RowButtonComponent>
    );
}
DeleteRowButtonComponent.propTypes = {
    disabled: PropTypes.bool.isRequired,
    openDialog: PropTypes.func.isRequired,
};
export default DeleteRowButtonComponent;
