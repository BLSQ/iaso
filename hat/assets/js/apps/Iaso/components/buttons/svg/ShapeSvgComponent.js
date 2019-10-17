import React from 'react';
import PropTypes from 'prop-types';

function ShapeSvg(props) {
    const {
        className,
    } = props;
    return (
        <svg className={className} focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation">
            <path d="M23 7V1h-6v2H7V1H1v6h2v10H1v6h6v-2h10v2h6v-6h-2V7h2zM3 3h2v2H3V3zm2 18H3v-2h2v2zm12-2H7v-2H5V7h2V5h10v2h2v10h-2v2zm4 2h-2v-2h2v2zM19 5V3h2v2h-2zm-5.27" />
        </svg>
    );
}

ShapeSvg.propTypes = {
    className: PropTypes.any.isRequired,
};

export default ShapeSvg;
