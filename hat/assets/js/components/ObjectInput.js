import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InputLabel from './InputLabel';

class ObjectInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.initialValue || this.props.schema.default || {},
        };
        this.handleChange = this.handleChange.bind(this);
    }
    handleChange(propName, value) {
        const newValue = Object.assign(this.state.value, { [propName]: value });
        this.setState({ value: newValue });
        if (this.props.onChange) {
            this.props.onChange(newValue);
        }
    }
    render() {
        const { schema, name } = this.props;
        const { value } = this.state;
        const properties = Object.keys(schema.properties).map((n) => {
            const s = schema.properties[n];
            let v = null;
            if (value.hasOwnProperty(n)) {
                v = value[n];
            } else if (s.hasOwnProperty('default')) {
                v = s.default;
            }
            const f = v2 => this.handleChange(n, v2);
            return <div className="object-input-property" key={n}>{renderSchema(s, n, v, f)}</div>;
        });
        return (
            <fieldset className="object-input">
                <InputLabel title={name} description={schema.description} />
                <div className="object-input-properties">{properties}</div>
            </fieldset>
        );
    }
}

ObjectInput.defaultProps = {
    onChange: () => {},
    schema: '',
    name: '',
    initialValue: '',
};


ObjectInput.propTypes = {
    initialValue: PropTypes.string,
    name: PropTypes.string,
    schema: PropTypes.string,
    onChange: PropTypes.func,
};


export default ObjectInput;
