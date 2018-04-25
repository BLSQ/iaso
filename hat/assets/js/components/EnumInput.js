import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InputLabel from './InputLabel';

class EnumInput extends Component {
    constructor(props) {
        super(props);
        this.state = { value: this.props.initialValue || '' };
        this.handleSelect = this.handleSelect.bind(this);
    }
    handleSelect(event) {
        const { value } = event.target;
        this.setState({ value });
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    }
    render() {
        const { schema, name } = this.props;
        const { value } = this.state;
        return (
            <div className="enum-input">
                <InputLabel title={name} description={schema.description} />
                <select value={value} onChange={this.handleSelect}>
                    {schema.enum.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>);
    }
}

EnumInput.defaultProps = {
    onChange: () => {},
    schema: '',
    name: '',
    initialValue: '',
};


EnumInput.propTypes = {
    initialValue: PropTypes.string,
    name: PropTypes.string,
    schema: PropTypes.string,
    onChange: PropTypes.func,
};

export default EnumInput;
