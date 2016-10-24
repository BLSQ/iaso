import React, {Component} from 'react'
import { FormattedMessage } from 'react-intl'

class InputLabel extends Component {
  constructor (props) {
    super(props)
    this.state = {
      visible: false
    }
  }
  render () {
    const {title, description} = this.props
    const {visible} = this.state
    return <div>
      <label>{capitalize(title)}:</label>
      {description && (
        <span>
          <span onClick={() => this.setState({visible: !visible})}> [{visible ? 'hide help' : 'show help'}]</span>
          <p className='input-help' style={{display: visible ? 'block' : 'none'}}>{description}</p>
        </span>
      )}
    </div>
  }
}

class ObjectInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this.props.initialValue || this.props.schema.default || {}
    }
    this.handleChange = this.handleChange.bind(this)
  }
  handleChange (propName, value) {
    const newValue = Object.assign(this.state.value, {[propName]: value})
    this.setState({value: newValue})
    if (this.props.onChange) {
      this.props.onChange(newValue)
    }
  }
  render () {
    const {schema, name} = this.props
    const {value} = this.state
    const properties = Object.keys(schema.properties).map((n) => {
      let s = schema.properties[n]
      let v = null
      if (value.hasOwnProperty(n)) {
        v = value[n]
      } else if (s.hasOwnProperty('default')) {
        v = s.default
      }
      const f = (v) => this.handleChange(n, v)
      return <div className='object-input-property' key={n}>{renderSchema(s, n, v, f)}</div>
    })
    return <fieldset className='object-input'>
      <InputLabel title={name} description={schema.description} />
      <div className='object-input-properties'>{properties}</div>
    </fieldset>
  }
}

class ArrayInput extends Component {
  constructor (props) {
    super(props)
    const {schema} = this.props
    this.state = {
      value: this.props.initialValue || schema.default || []
    }
    // The values will not have any information about the schema and because of that
    // we will only support one type of item schema and simply choose the first.
    this.itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items
    this.handleChange = this.handleChange.bind(this)
    this.handleAppend = this.handleAppend.bind(this)
  }
  handleChange (index, value) {
    let items = this.state.value
    items[index] = value
    this.setState({value: items})
    if (this.props.onChange) {
      this.props.onChange(items)
    }
  }
  handleAppend () {
    let items = this.state.value
    items.push(createValue(this.itemSchema))
    this.setState({value: items})
    if (this.props.onChange) {
      this.props.onChange(items)
    }
  }
  render () {
    const {schema, name} = this.props
    const {value} = this.state
    const items = value.map((v, i) => {
      const f = (v) => this.handleChange(i, v)
      return <div className='array-input-item' key={i}>{renderSchema(this.itemSchema, i, v, f)}</div>
    })
    return <fieldset className='array-input'>
      <InputLabel title={name} description={schema.description} />
      <button onClick={this.handleAppend}><FormattedMessage id='jsonschema.arrayinput.append' defaultMessage='Append' /></button>
      {items}
    </fieldset>
  }
}

class ValueInput extends Component {
  constructor (props) {
    super(props)
    this.state = {value: this.props.initialValue || ''}
    this.handleChange = this.handleChange.bind(this)
  }
  handleChange (event) {
    let value, parsedValue
    switch (this.props.schema.type) {
      case 'string':
        value = parsedValue = event.target.value
        break
      case 'integer':
        value = event.target.value
        parsedValue = parseInt(value, 10)
        break
      case 'number':
        value = event.target.value
        parsedValue = parseFloat(value)
        break
      case 'boolean':
        value = parsedValue = event.target.checked
        break
      default:
        throw new Error('Unsupported schema type for value input')
    }
    this.setState({value: value})
    if (this.props.onChange) {
      this.props.onChange(parsedValue)
    }
  }
  render () {
    const {schema, name} = this.props
    const {value} = this.state
    let inputType = 'text'
    if (schema.type === 'boolean') {
      inputType = 'checkbox'
    } else if (schema.type === 'string' && schema.format === 'date') {
      inputType = 'date'
    }
    return <div className='string-input'>
      <InputLabel title={name} description={schema.description} />
      <input type={inputType} value={value || ''} onChange={this.handleChange} />
    </div>
  }
}

class EnumInput extends Component {
  constructor (props) {
    super(props)
    this.state = {value: this.props.initialValue || ''}
    this.handleSelect = this.handleSelect.bind(this)
  }
  handleSelect (event) {
    const value = event.target.value
    this.setState({value: value})
    if (this.props.onChange) {
      this.props.onChange(value)
    }
  }
  render () {
    const {schema, name} = this.props
    const {value} = this.state
    return <div className='enum-input'>
      <InputLabel title={name} description={schema.description} />
      <select value={value} onChange={this.handleSelect}>
        {schema.enum.map((v) => {
          return <option key={v} value={v}>{v}</option>
        })}
      </select>
    </div>
  }
}

function capitalize (s) {
  return s.split(/[\s_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.substr(1))
    .join(' ')
}

function createValue (schema) {
  if (schema.enum && !schema.type) {
    return schema.hasOwnProperty('default') ? schema.default : ''
  }
  switch (schema.type) {
    case 'object': return schema.hasOwnProperty('default') ? schema.default : {}
    case 'array': return schema.hasOwnProperty('default') ? schema.default : []
    case 'any': // fall through
    case 'string': return schema.hasOwnProperty('default') ? schema.default : ''
    case 'integer': // fall through
    case 'number': return schema.hasOwnProperty('default') ? schema.default : 0
    case 'boolean': return schema.hasOwnProperty('default') ? schema.default : false
  }
}

function renderSchema (schema, name, initialValue, onChange) {
  if (schema.enum) {
    return <EnumInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />
  } else {
    if (!schema.type) {
      throw new Error('Schema needs a type or enum property: ' + JSON.stringify(schema))
    }
    switch (schema.type) {
      case 'object': return <ObjectInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />
      case 'array': return <ArrayInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />
      case 'boolean': // fall through
      case 'integer': // fall through
      case 'number': // fall through
      case 'any': // fall through
      case 'string': return <ValueInput schema={schema} name={name} initialValue={initialValue} onChange={onChange} />
    }
  }
}

class JsonSchema extends Component {
  render () {
    const {schema, name, initialValue, onChange} = this.props
    if (!schema) {
      return null
    }
    return <div className='json-schema'>
      {renderSchema(schema, name, initialValue, onChange)}
    </div>
  }
}

export default JsonSchema
