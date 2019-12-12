import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

class Filters extends React.Component {
    render() {
        const { filters, isRequired } = this.props;
        if (!filters) {
            return null;
        }

        const provinceValue = filters.provinceId;
        return (
            <div>
                <div className="location-filter">
                    <div className="location-subtitle">
                        <FormattedMessage id="main.label.provinces" defaultMessage="Provinces" />
                    </div>
                    {
                        filters.provinces
                        && (
                            <Select
                                className={isRequired && !provinceValue ? 'form-error' : null}
                                multi={this.props.isMultiSelect}
                                clearable={this.props.isClearable}
                                simpleValue
                                name="provinceId"
                                value={provinceValue}
                                placeholder="--"
                                options={filters.provinces.map(province => ({ label: province.name, value: province.id }))}
                                onChange={value => this.props.selectProvince(value)}
                            />
                        )
                    }
                </div>
                {filters.zones && filters.zones.length !== 0
                    && (
                        <div className="location-filter">
                            <div className="location-subtitle">
                                <FormattedMessage id="main.label.zones" defaultMessage="Health zones" />
                            </div>
                            <div>
                                <Select
                                    className={isRequired && !filters.zoneId ? 'form-error' : null}
                                    multi={this.props.isMultiSelect}
                                    clearable={this.props.isClearable}
                                    simpleValue
                                    name="zoneId"
                                    value={filters.zoneId}
                                    placeholder="--"
                                    options={filters.zones.map(zone => ({ label: zone.name, value: zone.id }))}
                                    onChange={value => this.props.selectZone(value)}
                                />
                            </div>
                        </div>
                    )
                }
                {filters.areas && filters.areas.length !== 0
                    && (
                        <div className="location-filter">
                            <div className="location-subtitle">
                                <FormattedMessage id="main.label.areas" defaultMessage="Health area" />
                            </div>
                            <div>
                                <Select
                                    className={isRequired && (!filters.areaId && !filters.villageId) ? 'form-error' : null}
                                    multi={this.props.isMultiSelect}
                                    clearable={this.props.isClearable}
                                    simpleValue
                                    name="areaId"
                                    value={filters.areaId}
                                    placeholder="--"
                                    options={filters.areas.map(area => ({ label: area.name, value: area.id }))}
                                    onChange={value => this.props.selectArea(value)}
                                />
                            </div>
                        </div>
                    )
                }
                {
                    this.props.showVillages
                    && filters.villages
                    && filters.villages.length !== 0
                    && (
                        <div>
                            <div className="location-filter">
                                <div className="location-subtitle">
                                    <FormattedMessage id="main.label.village" defaultMessage="Village" />
                                </div>
                                <Select
                                    className={isRequired && !filters.villageId ? 'form-error' : null}
                                    multi={this.props.isMultiSelect}
                                    clearable={this.props.isClearable}
                                    simpleValue
                                    name="villageId"
                                    value={filters.villageId}
                                    placeholder="--"
                                    options={filters.villages.map(village => ({ label: village.name, value: village.id }))}
                                    onChange={value => this.props.selectVillage(value)}
                                    noResultsText={<FormattedMessage id="main.label.noVillage" defaultMessage="No village found" />}
                                />
                            </div>
                        </div>
                    )
                }
                {filters.villages && this.props.showVillages
                    && filters.villages.length === 0 && filters.areas.length !== 0 && filters.areaId
                    && (
                        <div className="location-filter">
                            <div className="location-subtitle no-result">
                                <FormattedMessage id="main.label.noVillage" defaultMessage="No village found" />
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }
}

Filters.defaultProps = {
    isMultiSelect: false,
    showVillages: true,
    isClearable: false,
    selectVillage: () => { },
    isRequired: false,
};

Filters.propTypes = {
    filters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func,
    isMultiSelect: PropTypes.bool,
    showVillages: PropTypes.bool,
    isClearable: PropTypes.bool,
    isRequired: PropTypes.bool,
};

export default Filters;
