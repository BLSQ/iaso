import React from 'react';
import PropTypes from 'prop-types';
import XmlSvg from '../svg/XmlSvgComponent';

import RowButtonComponent from './RowButtonComponent';

function XmlButtonComponent({ onClick, iconProps }) {
    return (
        <RowButtonComponent
            onClick={onClick}
            tooltipMessage={{ id: 'iaso.label.downloadXml', defaultMessage: 'Download XML' }}
        >
            <XmlSvg {...iconProps} />
        </RowButtonComponent>
    );
}

XmlButtonComponent.defaultProps = {
    iconProps: {},
};

XmlButtonComponent.propTypes = {
    onClick: PropTypes.func.isRequired,
    iconProps: PropTypes.object,
};

export default XmlButtonComponent;
