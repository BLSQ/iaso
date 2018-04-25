import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

class ValueVis extends Component {
    render() {
        return <p><FormattedMessage id="value_vis.value" defaultMessage="Value:" /> {this.props.data.value}</p>;
    }
}
ValueVis.defaultProps = {
    data: undefined,
};

ValueVis.propTypes = {
    data: PropTypes.shape({
        value: PropTypes.number,
    }),
};

export default ValueVis;
