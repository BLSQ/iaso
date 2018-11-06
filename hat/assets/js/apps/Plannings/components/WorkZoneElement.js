/*
 * This component displays the list of selected villages. It also allows to
 * remove (`deselect`) them from the list (one by one or all together),
 * or to identify the selected village in the the map (`show`).
 */

import React, { Component } from 'react';
import Select from 'react-select';
import { GithubPicker } from 'react-color';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { formatThousand } from '../../../utils';
import workZonesColors from '../utils/constants/colors';

const MESSAGES = defineMessages({
    capacity: {
        defaultMessage: 'capacité',
        id: 'macroplanning.capacity',
    },
    population: {
        defaultMessage: 'population',
        id: 'macroplanning.population',
    },
    endemic_population: {
        defaultMessage: 'endémique',
        id: 'macroplanning.endemic_population',
    },
    lowCapacity: {
        defaultMessage: 'Capacité insuffisante',
        id: 'macroplanning.lowCapacity',
    },
});


class WorkZoneElement extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isZonesOpen: true,
            isAreasOpen: true,
        };
    }

    toggelSubSection(key) {
        const newState = Object.assign({}, this.state, { [key]: !this.state[key] });
        this.setState(newState);
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            workZone,
            saveWorkZoneColor,
            selectWorkZone,
            selectedWorkZoneId,
            toggleColors,
            zones,
            areas,
            index,
            compareZs,
            compareAs,
        } = this.props;
        return (
            <li
                key={workZone.id}
                className={`workzones-item ${selectedWorkZoneId === workZone.id ? 'selected' : ''}`}
            >
                <span
                    style={{ backgroundColor: workZone.color }}
                    onClick={() => toggleColors(workZone.id, typeof workZone.showColor !== 'undefined' ? !workZone.showColor : true)}
                    role="button"
                    tabIndex={0}
                />
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectWorkZone(workZone.id)}
                    className={`infos ${parseInt(workZone.total_capacity, 10) < parseInt(workZone.population_endemic_villages, 10) ? 'alert' : ''}`}
                >
                    {`${workZone.name} - `}
                    <span>
                        {formatMessage(MESSAGES.capacity)} {formatThousand(workZone.total_capacity)} / {formatMessage(MESSAGES.endemic_population)} {formatThousand(workZone.population_endemic_villages)}
                    </span>
                    {
                        parseInt(workZone.total_capacity, 10) < parseInt(workZone.population_endemic_villages, 10) ?
                            <span>
                                {' '}({formatMessage(MESSAGES.lowCapacity)})
                            </span>
                            : ''
                    }
                    {
                        selectedWorkZoneId === workZone.id &&
                        <i className="fa fa-chevron-down" />
                    }
                    {
                        selectedWorkZoneId !== workZone.id &&
                        <i className="fa fa-chevron-right" />
                    }
                </div>
                <div className={`color-picker-container${workZone.showColor ? ' visible' : ''}`} >
                    <GithubPicker
                        width={`${26.2 * workZonesColors.length}px`}
                        colors={workZonesColors}
                        color={workZone.color ? workZone.color : workZonesColors[index]}
                        onChangeComplete={color => saveWorkZoneColor(color.hex, workZone.id)}
                    />
                </div>
                <div className="expand-collapse">
                    <div>
                        <div className="locator-filter">
                            <div
                                role="button"
                                tabIndex={0}
                                className="locator-subtitle"
                                onClick={() => this.toggelSubSection('isZonesOpen')}
                            >
                                <FormattedMessage id="macroplanning.label.zones" defaultMessage="Zone de santé" />
                                {
                                    this.state.isZonesOpen &&
                                    <i className="fa fa-minus" />
                                }
                                {
                                    !this.state.isZonesOpen &&
                                    <i className="fa fa-plus" />
                                }
                            </div>
                            <div className={this.state.isZonesOpen ? 'open' : ''}>
                                <Select
                                    multi
                                    clearable={false}
                                    name="zoneId"
                                    value={workZone.currentZones}
                                    placeholder="--"
                                    options={zones.features.map(zone =>
                                        ({ label: zone.properties.name, value: zone.properties.pk }))}
                                    onChange={value => compareZs(value, index)}
                                />
                            </div>
                        </div>
                        <div className="locator-filter">
                            <div
                                role="button"
                                tabIndex={0}
                                className="locator-subtitle"
                                onClick={() => this.toggelSubSection('isAreasOpen')}
                            >
                                <FormattedMessage id="macroplanning.label.areas" defaultMessage="Aires de santé" />
                                {
                                    this.state.isAreasOpen &&
                                    <i className="fa fa-minus" />
                                }
                                {
                                    !this.state.isAreasOpen &&
                                    <i className="fa fa-plus" />
                                }
                            </div>
                            <div className={this.state.isAreasOpen ? 'open' : ''}>
                                <Select
                                    multi
                                    clearable={false}
                                    name="areaId"
                                    value={workZone.currentAreas}
                                    placeholder="--"
                                    options={areas.features.map(area =>
                                        ({ label: area.properties.name, value: area.properties.pk }))}
                                    onChange={value => compareAs(value, index)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        );
    }
}
WorkZoneElement.defaultProps = {
    selectedWorkZoneId: undefined,
    zones: undefined,
    areas: undefined,
};

WorkZoneElement.propTypes = {
    intl: PropTypes.object.isRequired,
    workZone: PropTypes.object.isRequired,
    selectWorkZone: PropTypes.func.isRequired,
    saveWorkZoneColor: PropTypes.func.isRequired,
    selectedWorkZoneId: PropTypes.number,
    zones: PropTypes.object,
    areas: PropTypes.object,
    toggleColors: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    compareZs: PropTypes.func.isRequired,
    compareAs: PropTypes.func.isRequired,
};

export default injectIntl(WorkZoneElement);
