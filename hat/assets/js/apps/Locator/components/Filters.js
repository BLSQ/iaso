import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

class Filters extends React.Component {
    render() {
        const { filters } = this.props;
        if (!filters) {
            return null;
        }
        return (
            <div>
                <div className="locator-filter">
                    <div className="locator-subtitle">Province</div>
                    <Select
                        multi={this.props.isMultiSelect}
                        clearable={this.props.isClearable}
                        simpleValue
                        name="provinceId"
                        value={filters.provinceId}
                        placeholder="--"
                        options={filters.provinces.map(province =>
                            ({ label: province.name, value: province.id }))}
                        onChange={event => this.props.selectProvince(event)}
                    />
                </div>
                {filters.zones.length !== 0 &&
                    <div className="locator-filter">
                        <div className="locator-subtitle">Zone de santé</div>
                        <div>
                            <Select
                                multi={this.props.isMultiSelect}
                                clearable={this.props.isClearable}
                                simpleValue
                                name="zoneId"
                                value={filters.zoneId}
                                placeholder="--"
                                options={filters.zones.map(zone =>
                                    ({ label: zone.name, value: zone.id }))}
                                onChange={event => this.props.selectZone(event)}
                            />
                        </div>
                    </div>
                }
                {filters.areas.length !== 0 &&
                    <div className="locator-filter">
                        <div className="locator-subtitle">Aire de santé</div>
                        <div>
                            <Select
                                multi={this.props.isMultiSelect}
                                clearable={this.props.isClearable}
                                simpleValue
                                name="areaId"
                                value={filters.areaId}
                                placeholder="--"
                                options={filters.areas.map(area =>
                                    ({ label: area.name, value: area.id }))}
                                onChange={event => this.props.selectArea(event)}
                            />
                        </div>
                    </div>
                }
                {filters.villages && filters.villages.length !== 0 && this.props.showVillages &&
                    <div className="locator-filter">
                        <div className="locator-subtitle">Village</div>
                        <div>
                            <Select
                                multi={this.props.isMultiSelect}
                                clearable={this.props.isClearable}
                                simpleValue
                                name="villageId"
                                value={filters.villageId}
                                placeholder="--"
                                options={filters.villages.map(village =>
                                    ({ label: village.name, value: village.id }))}
                                onChange={event => this.props.selectVillage(event)}
                            />
                        </div>
                    </div>
                }
                {filters.villages && this.props.showVillages &&
                    filters.villages.length === 0 && filters.areas.length !== 0 && filters.areaId &&
                    <div className="locator-filter">
                        <div className="locator-subtitle no-result">
                            <FormattedMessage id="locator.label.noresult" defaultMessage="Aucun village trouvé" />
                        </div>
                    </div>
                }
            </div>
        );
    }
}

Filters.defaultProps = {
    isMultiSelect: false,
    showVillages: true,
    isClearable: false,
};

Filters.propTypes = {
    filters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    isMultiSelect: PropTypes.bool,
    showVillages: PropTypes.bool,
    isClearable: PropTypes.bool,
};

export default Filters;
