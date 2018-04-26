import React, { Component } from 'react';
import PropTypes from 'prop-types';

function capitalize(s) {
    return s.split(/[\s_-]/)
        .map(w => w.charAt(0).toUpperCase() + w.substr(1))
        .join(' ');
}

class InputLabel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
        };
    }
    render() {
        const { title, description } = this.props;
        const { visible } = this.state;
        return (
            <div>
                <label>{capitalize(title)}:</label>
                {description && (
                    <span>
                        <span
                            tabIndex={0}
                            role="button"
                            onClick={() => this.setState({ visible: !visible })}
                        > [{visible ? 'hide help' : 'show help'}]
                        </span>
                        <p className="input-help" style={{ display: visible ? 'block' : 'none' }}>{description}</p>
                    </span>
                )}
            </div>
        );
    }
}

InputLabel.defaultProps = {
    title: '',
    description: '',
};


InputLabel.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
};

export default InputLabel;
