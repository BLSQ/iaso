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

const mapWorkZones = (workzones) => {
    const mappedWorkzones = [];
    workzones.map((w) => {
        const currentAreas = w.as_list ?
            w.as_list.reduce((prev, next) => `${prev === '' ? '' : `${prev},`}${next.id}`, '') : null;
        const currentZones = w.as_list ?
            w.as_list.reduce((prev, next) => {
                if (prev.indexOf(next.zs_id) === -1) {
                    prev.push(next.zs_id);
                }
                return prev;
            }, []) : null;
        const newWorkZone = Object.assign({}, w, { currentAreas, currentZones: currentZones.toString() });
        mappedWorkzones.push(newWorkZone);
        return null;
    });
    return mappedWorkzones;
};

class WorkZonesSelect extends Component {
    constructor(props) {
        super(props);
        const mappedWorkzones = mapWorkZones(props.workZones);
        this.state = {
            workZones: mappedWorkzones,
        };
    }

    componentWillReceiveProps(nextProps) {
        const mappedWorkzones = mapWorkZones(nextProps.workZones);
        this.setState({
            workZones: mappedWorkzones,
        });
    }

    toggleColors(workZoneId, show) {
        const newWorkZones = this.state.workZones.slice();
        this.state.workZones.map((w, index) => {
            if (w.id === workZoneId) {
                newWorkZones[index].showColor = show;
            } else {
                newWorkZones[index].showColor = false;
            }
            return null;
        });
        this.setState({
            workZones: newWorkZones,
        });
    }

    compareZs(zslist, workZoneIndex) {
        const currentWorkZone = Object.assign(this.state.workZones[workZoneIndex]);
        let currentZsId;
        const action = zslist.length > currentWorkZone.currentZones.split(',').length || currentWorkZone.currentZones === '';
        if (action) {
            if (currentWorkZone.currentZones === '') {
                currentZsId = zslist[0].value;
            } else {
                zslist.map((newAs) => {
                    if (currentWorkZone.currentZones.split(',').filter(oldZs => oldZs === parseInt(newAs.value, 10)).length === 0) {
                        currentZsId = newAs.value;
                    }
                    return null;
                });
            }
        } else {
            currentWorkZone.currentZones.split(',').map((oldZs) => {
                if (zslist.filter(newAs => newAs.value === oldZs).length === 0) {
                    currentZsId = oldZs;
                }
                return null;
            });
        }
        this.props.assignToWorkZone(action, parseInt(currentZsId, 10), '', currentWorkZone.id.toString());
    }

    compareAs(asList, workZoneIndex) {
        const currentWorkZone = Object.assign(this.state.workZones[workZoneIndex]);
        let currentAsId;
        const action = asList.length > currentWorkZone.as_list.length || currentWorkZone.as_list.length === 0;
        if (action) {
            if (currentWorkZone.as_list.length === 0) {
                currentAsId = asList[0].value;
            } else {
                asList.map((newAs) => {
                    if (currentWorkZone.as_list.filter(oldAs => oldAs.id === parseInt(newAs.value, 10)).length === 0) {
                        currentAsId = newAs.value;
                    }
                    return null;
                });
            }
        } else {
            currentWorkZone.as_list.map((oldAs) => {
                if (asList.filter(newAs => parseInt(newAs.value, 10) === oldAs.id).length === 0) {
                    currentAsId = oldAs.id;
                }
                return null;
            });
        }
        this.props.assignToWorkZone(action, null, currentAsId, currentWorkZone.id.toString());
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            saveWorkZoneColor,
            selectWorkZone,
            selectedWorkZoneId,
            currentCoordination: {
                zones,
                areas,
            },
        } = this.props;
        const { workZones } = this.state;
        return (
            <div>
                <ul className="workzones-list" onMouseLeave={() => this.toggleColors()}>
                    {
                        workZones.map((w, index) => (
                            <li
                                key={w.id}
                                className={`workzones-item ${selectedWorkZoneId === w.id ? 'selected' : ''}`}
                            >
                                <span
                                    style={{ backgroundColor: w.color }}
                                    onClick={() => this.toggleColors(w.id, typeof w.showColor !== 'undefined' ? !w.showColor : true)}
                                    role="button"
                                    tabIndex={0}
                                />
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => selectWorkZone(w.id)}
                                    className={`infos ${parseInt(w.total_capacity, 10) < parseInt(w.population_endemic_villages, 10) ? 'alert' : ''}`}
                                >
                                    {`${w.name} - `}
                                    <span>
                                        {formatMessage(MESSAGES.capacity)} {formatThousand(w.total_capacity)} / {formatMessage(MESSAGES.endemic_population)} {formatThousand(w.population_endemic_villages)}
                                    </span>
                                    {
                                        parseInt(w.total_capacity, 10) < parseInt(w.population_endemic_villages, 10) ?
                                            <span>
                                                {' '}({formatMessage(MESSAGES.lowCapacity)})
                                            </span>
                                            : ''
                                    }
                                    {
                                        selectedWorkZoneId === w.id &&
                                        <i className="fa fa-chevron-down" />
                                    }
                                    {
                                        selectedWorkZoneId !== w.id &&
                                        <i className="fa fa-chevron-right" />
                                    }
                                </div>
                                <div className={`color-picker-container${w.showColor ? ' visible' : ''}`} >
                                    <GithubPicker
                                        width={`${26.2 * workZonesColors.length}px`}
                                        colors={workZonesColors}
                                        color={w.color ? w.color : workZonesColors[index]}
                                        onChangeComplete={color => saveWorkZoneColor(color.hex, w.id)}
                                    />
                                </div>
                                <div className="expand-collapse">
                                    <div>
                                        <div className="locator-filter">
                                            <div className="locator-subtitle">
                                                <FormattedMessage id="macroplanning.label.zones" defaultMessage="Zone de santé" />
                                            </div>
                                            <div>
                                                <Select
                                                    multi
                                                    clearable={false}
                                                    name="zoneId"
                                                    value={w.currentZones}
                                                    placeholder="--"
                                                    options={zones.features.map(zone =>
                                                        ({ label: zone.properties.name, value: zone.properties.pk }))}
                                                    onChange={value => this.compareZs(value, index)}
                                                />
                                            </div>
                                        </div>
                                        <div className="locator-filter">
                                            <div className="locator-subtitle">
                                                <FormattedMessage id="macroplanning.label.areas" defaultMessage="Aires de santé" />
                                            </div>
                                            <div>
                                                <Select
                                                    multi
                                                    clearable={false}
                                                    name="areaId"
                                                    value={w.currentAreas}
                                                    placeholder="--"
                                                    options={areas.features.map(area =>
                                                        ({ label: area.properties.name, value: area.properties.pk }))}
                                                    onChange={value => this.compareAs(value, index)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    }

                    <li className="workzones-item none">
                        <span
                            style={{ backgroundColor: 'grey' }}
                        />
                        <div className="infos">
                            <FormattedMessage id="macroplanning.legend.notAssigned" defaultMessage="Aucun rayon d'action" />
                        </div>
                    </li>
                </ul>
            </div>
        );
    }
}
WorkZonesSelect.defaultProps = {
    workZones: [],
    selectedWorkZoneId: undefined,
    currentCoordination: {
        zones: [],
        areas: [],
    },
};

WorkZonesSelect.propTypes = {
    intl: PropTypes.object.isRequired,
    workZones: PropTypes.arrayOf(PropTypes.object),
    selectWorkZone: PropTypes.func.isRequired,
    saveWorkZoneColor: PropTypes.func.isRequired,
    selectedWorkZoneId: PropTypes.number,
    currentCoordination: PropTypes.object,
    assignToWorkZone: PropTypes.func.isRequired,
};

export default injectIntl(WorkZonesSelect);
