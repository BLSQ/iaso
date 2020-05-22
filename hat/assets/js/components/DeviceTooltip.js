
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Tooltip,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

const getDeviceTooltipContent = device => (
    <div>
        <div>
            <span>ID:</span>
            <span className="margin-left--tiny--tiny inline-block">{device.device_id}</span>
        </div>
        <div>
            <span>
                <FormattedMessage id="patientsCases.device.last_user" defaultMessage="Last user" />
                :
            </span>
            <span className="margin-left--tiny--tiny inline-block">
                {device && device.last_user ? device.last_user : '--'}
            </span>
        </div>
        <div>
            <span>
                <FormattedMessage id="patientsCases.device.last_team" defaultMessage="Last team" />
                :
            </span>
            <span className="margin-left--tiny--tiny inline-block">
                {device && device.last_team ? device.last_team : '--'}
            </span>
        </div>
    </div>
);

class DeviceTooltip extends Component {
    handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onSelect(this.props.option, event);
    }

    handleMouseEnter(event) {
        this.props.onFocus(this.props.option, event);
    }

    handleMouseMove(event) {
        if (this.props.isFocused) return;
        this.props.onFocus(this.props.option, event);
    }

    render() {
        return (
            <div
                tabIndex={0}
                role="button"
                className={this.props.className}
                onMouseDown={event => this.handleMouseDown(event)}
                onMouseEnter={event => this.handleMouseEnter(event)}
                onMouseMove={event => this.handleMouseMove(event)}
                title={this.props.option.title}
            >
                <Tooltip title={getDeviceTooltipContent(this.props.option.device)} arrow>
                    <span>{this.props.children}</span>
                </Tooltip>
            </div>
        );
    }
}

DeviceTooltip.defaultProps = {
    children: null,
};

DeviceTooltip.propTypes = {
    children: PropTypes.any,
    isFocused: PropTypes.bool.isRequired,
    option: PropTypes.object.isRequired,
    className: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
};

export default DeviceTooltip;
