import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'

/*
villageFiltersInitialState = {
  province: null,
  zone: null,
  area: null,
  key: null,
  provinces: [],
  zones: [],
  areas: []
}
 */

class Filters extends React.Component {
  render () {
    let filters = this.props.filters
    console.log('provinces', filters.provinces)
    return <div>
      <div className="locator-subtitle">Province</div>
      <div>
        <Select
          simpleValue
          name='provinceId'
          value={filters.provinceId}
          placeholder={'--'}
          options={filters.provinces.map(province => ({label: province.name, value: province.id}))}
          onChange={event => this.props.selectProvince(event)}
        />
      </div>
      {filters.zones.length != 0 &&
      <div>
        <div className="locator-subtitle">Zone de santé</div>
        <div>
          <Select
            simpleValue
            name='zoneId'
            value={filters.zoneId}
            placeholder={'--'}
            options={filters.zones.map(zone => ({label: zone.name, value: zone.id}))}
            onChange={event => this.props.selectZone(event)}
          />
        </div>
      </div>
      }
      {filters.areas.length != 0 &&
      <div>
        <div className="locator-subtitle">Aires de santé</div>
        <div>
          <Select
            simpleValue
            name='areaId'
            value={filters.areaId}
            placeholder={'--'}
            options={filters.areas.map(area => ({label: area.name, value: area.id}))}
            onChange={event => this.props.selectArea(event)}
          />
        </div>
      </div>
      }
      {filters.villages.length != 0 &&
      <div>
        <div className="locator-subtitle">Villages</div>
        <div>
          <Select
            simpleValue
            name='villageId'
            value={filters.villageId}
            placeholder={'--'}
            options={filters.villages.map(village => ({label: village.name, value: village.id}))}
            onChange={event => this.props.selectVillage(event)}
          />
        </div>
      </div>
      }
    </div>
  }

}

Filters.propTypes = {
  filters: PropTypes.object.isRequired,
  selectProvince: PropTypes.func,
  selectZone: PropTypes.func,
  selectArea: PropTypes.func,
  selectVillage: PropTypes.func
}

export default Filters