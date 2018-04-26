import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import InputLabel from './InputLabel';
import EnumInput from './EnumInput';
import ObjectInput from './ObjectInput';
import ValueInput from './ValueInput';

function createValue(schema) {
    if (schema.enum && !schema.type) {
        return schema.hasOwnProperty('default') ? schema.default : '';
    }
    switch (schema.type) {
        case 'object': return schema.hasOwnProperty('default') ? schema.default : {};
        case 'array': return schema.hasOwnProperty('default') ? schema.default : [];
        case 'any': // fall through
        case 'string': return schema.hasOwnProperty('default') ? schema.default : '';
        case 'integer': // fall through
        case 'number': return schema.hasOwnProperty('default') ? schema.default : 0;
        case 'boolean': return schema.hasOwnProperty('default') ? schema.default : false;
        default: // fall through
    }
    return true;
}

function renderSchema(schema, name, initialValue, onChange) {
    if (schema.enum) {
        return (<EnumInput
            schema={schema}
            name={name}
            initialValue={initialValue}
            onChange={onChange}
        />);
    }
    if (!schema.type) {
        throw new Error(`Schema needs a type or enum property: ${JSON.stringify(schema)}`);
    }
    switch (schema.type) {
        case 'object': return <ObjectInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />;
        case 'array': return <ArrayInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />;
        case 'boolean': // fall through
        case 'integer': // fall through
        case 'number': // fall through
        case 'any': // fall through
        case 'string': return <ValueInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />;
        default: // fall through
    }
    return true;
}

class ArrayInput extends Component {
    constructor(props) {
        super(props);
        const { schema } = this.props;
        this.state = {
            value: this.props.initialValue || schema.default || [],
        };
        // The values will not have any information about the schema and because of that
        // we will only support one type of item schema and simply choose the first.
        this.itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
        this.handleChange = this.handleChange.bind(this);
        this.handleAppend = this.handleAppend.bind(this);
    }
    handleChange(index, value) {
        const items = this.state.value;
        items[index] = value;
        this.setState({ value: items });
        if (this.props.onChange) {
            this.props.onChange(items);
        }
    }
    handleAppend() {
        const items = this.state.value;
        items.push(createValue(this.itemSchema));
        this.setState({ value: items });
        if (this.props.onChange) {
            this.props.onChange(items);
        }
    }
    render() {
        const { schema, name } = this.props;
        const { value } = this.state;
        const items = value.map((v, i) => {
            const f = v2 => this.handleChange(i, v2);
            return <div className="array-input-item" key={i}>{renderSchema(this.itemSchema, i, v, f)}</div>; // eslint-disable-line
        });
        return (
            <fieldset className="array-input">
                <InputLabel title={name} description={schema.description} />
                <button onClick={this.handleAppend}><FormattedMessage id="jsonschema.arrayinput.append" defaultMessage="Append" /></button>
                {items}
            </fieldset>
        );
    }
}

ArrayInput.defaultProps = {
    onChange: () => {},
    schema: '',
    name: '',
    initialValue: '',
};


ArrayInput.propTypes = {
    initialValue: PropTypes.string,
    name: PropTypes.string,
    schema: PropTypes.string,
    onChange: PropTypes.func,
};


export default ArrayInput;
