
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import Switch from 'react-switch';


class PermissionsComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            checked: false,
        };
    }

    handleChange(checked) {
        this.setState({ checked });
    }

    render() {
        console.log(this.props.permissions);
        return (
            <section>
                <Switch
                    onChange={checked => this.handleChange(checked)}
                    checked={this.state.checked}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={30}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                />
            </section>
        );
    }
}
PermissionsComponent.propTypes = {
    permissions: PropTypes.array.isRequired,
};

export default injectIntl(PermissionsComponent);
