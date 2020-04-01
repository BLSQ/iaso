import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
    message,
}) => (
    <div className="widget__spinner">
        <div className="widget__spinner--text">{message !== '' ? `${message}…` : ''}</div>
        <div className="widget__spinner--icon">
            <i className="fa fa-spinner fa-pulse fa-5x fa-fw" />
        </div>
    </div>
);
LoadingSpinner.defaultProps = {
    message: '',
};

LoadingSpinner.propTypes = {
    message: PropTypes.string,
};

export default LoadingSpinner;
