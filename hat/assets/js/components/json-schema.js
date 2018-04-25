import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EnumInput from './EnumInput';
import ObjectInput from './ObjectInput';
import ValueInput from './ValueInput';
import ArrayInput from './ArrayInput';

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
// Experimental components to render a json-schema as ui
// Main component is: `JsonSchema`
class JsonSchema extends Component {
    render() {
        const {
            schema, name, initialValue, onChange,
        } = this.props;
        if (!schema) {
            return null;
        }
        return (
            <div className="json-schema">
                {renderSchema(schema, name, initialValue, onChange)}
            </div>);
    }
}

JsonSchema.defaultProps = {
    onChange: () => {},
    schema: '',
    name: '',
    initialValue: '',
};


JsonSchema.propTypes = {
    initialValue: PropTypes.string,
    name: PropTypes.string,
    schema: PropTypes.string,
    onChange: PropTypes.func,
};


export default JsonSchema;
