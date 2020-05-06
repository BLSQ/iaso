import React from 'react';
import PropTypes from 'prop-types';
import Edit from '@material-ui/icons/RemoveRedEye';

import RowButtonComponent from './RowButtonComponent';

function ViewRowButtonComponent({ onClick, url, asLink }) {
    return (
        <RowButtonComponent
            onClick={onClick}
            tooltipMessage={{ id: 'iaso.label.view', defaultMessage: 'View' }}
            url={url}
            asLink={asLink}
        >
            <Edit />
        </RowButtonComponent>
    );
}
ViewRowButtonComponent.defaultProps = {
    url: '',
    asLink: false,
    onClick: () => null,
};
ViewRowButtonComponent.propTypes = {
    onClick: PropTypes.func,
    url: PropTypes.string,
    asLink: PropTypes.bool,
};
export default ViewRowButtonComponent;
