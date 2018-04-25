import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InputLabel from './InputLabel';


class ValueInput extends Component {
    constructor(props) {
        super(props);
        this.state = { value: this.props.initialValue || '' };
        this.handleChange = this.handleChange.bind(this);
    }
    handleChange(event) {
        let value;
        let parsedValue;
        switch (this.props.schema.type) {
            case 'string':
                ({ value } = event.target);
                parsedValue = event.target.checked;
                break;
            case 'integer':
                ({ value } = event.target);
                parsedValue = parseInt(value, 10);
                break;
            case 'number':
                ({ value } = event.target);
                parsedValue = parseFloat(value);
                break;
            case 'boolean':
                value = event.target.checked;
                parsedValue = event.target.checked;
                break;
            default:
                throw new Error('Unsupported schema type for value input');
        }
        this.setState({ value });
        if (this.props.onChange) {
            this.props.onChange(parsedValue);
        }
    }
    render() {
        const { schema, name } = this.props;
        const { value } = this.state;
        let inputType = 'text';
        if (schema.type === 'boolean') {
            inputType = 'checkbox';
        } else if (schema.type === 'string' && schema.format === 'date') {
            inputType = 'date';
        }
        return (
            <div className="string-input">
                <InputLabel title={name} description={schema.description} />
                <input type={inputType} value={value || ''} onChange={this.handleChange} />
            </div>);
    }
}


ValueInput.defaultProps = {
    onChange: () => {},
    schema: '',
    name: '',
    initialValue: '',
};


ValueInput.propTypes = {
    initialValue: PropTypes.string,
    name: PropTypes.string,
    schema: PropTypes.string,
    onChange: PropTypes.func,
};


export default ValueInput;
