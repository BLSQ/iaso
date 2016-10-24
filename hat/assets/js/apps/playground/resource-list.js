import React, {Component, PropTypes} from 'react'
import { FormattedMessage } from 'react-intl'

class ResourceList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      items: [],
      value: ''
    }
    this.handleSelect = this.handleSelect.bind(this)
  }

  handleSelect (event) {
    let name = event.target.value
    let item = this.state.items.find((i) => i.name === name)
    this.setState({value: name})
    if (this.props.onSelect) {
      this.props.onSelect(item)
    }
  }

  componentDidMount () {
    window.fetch(this.props.url, {headers: {'Accept': 'application/json'}, credentials: 'include'})
      .then((resp) => resp.json())
      .then((json) => {
        this.setState({items: json})
      })
  }

  render () {
    // const {title} = this.props
    const {items, value} = this.state

    return <div>
      <label><FormattedMessage id='resourcelist.none' defaultMessage='Datasets:' /></label>
      <select value={value} onChange={this.handleSelect}>
        <option key='none' value=''><FormattedMessage id='resourcelist.none' defaultMessage='None' /></option>
        {items.map((item, i) => {
          return <option key={i} value={item.name}>{item.name}</option>
        })}
      </select>
    </div>
  }
}

ResourceList.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  onSelect: PropTypes.func
}

export default ResourceList
