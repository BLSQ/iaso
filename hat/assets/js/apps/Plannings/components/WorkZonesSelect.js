/*
 * This component displays the list of selected villages. It also allows to
 * remove (`deselect`) them from the list (one by one or all together),
 * or to identify the selected village in the the map (`show`).
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { injectIntl, FormattedMessage } from 'react-intl';
import WorkZoneElement from './WorkZoneElement';

const mapDatas = (workzones, allAreas) => {
    const datas = {
        mappedWorkzones: [],
        unUsedAreas: [],
    };
    let usedAreas = [];
    workzones.map((w) => {
        if (w.as_list) {
            usedAreas = usedAreas.concat(w.as_list);
        }
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
        datas.mappedWorkzones.push(newWorkZone);
        return null;
    });
    allAreas.map((a) => {
        const areaId = parseInt(a.properties.pk, 10);
        if (usedAreas.filter(u => u.id === areaId).length === 0) {
            datas.unUsedAreas.push(areaId);
        }
        return null;
    });
    return datas;
};

class WorkZonesSelect extends Component {
    constructor(props) {
        super(props);
        const mappedDatas = mapDatas(props.workZones, props.currentCoordination.areas.features);
        this.state = {
            workZones: mappedDatas.mappedWorkzones,
            unUsedAreas: mappedDatas.unUsedAreas,
            isAreasOpen: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        const mappedDatas = mapDatas(nextProps.workZones, nextProps.currentCoordination.areas.features);
        this.setState({
            workZones: mappedDatas.mappedWorkzones,
            unUsedAreas: mappedDatas.unUsedAreas,
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
                            <WorkZoneElement
                                key={`work-zone-${w.id}`}
                                workZone={w}
                                index={index}
                                zones={zones}
                                areas={areas}
                                selectedWorkZoneId={selectedWorkZoneId}
                                saveWorkZoneColor={saveWorkZoneColor}
                                selectWorkZone={selectWorkZone}
                                toggleColors={(workZoneId, show) => this.toggleColors(workZoneId, show)}
                                compareZs={(zslist, workZoneIndex) => this.compareZs(zslist, workZoneIndex)}
                                compareAs={(asList, workZoneIndex) => this.compareAs(asList, workZoneIndex)}
                            />
                        ))
                    }

                    <li className="workzones-item none selected">
                        <section>
                            <span
                                style={{ backgroundColor: 'grey' }}
                            />
                            <div className="infos">
                                <FormattedMessage id="macroplanning.legend.notAssigned" defaultMessage="Aucun rayon d'action" />
                            </div>
                        </section>
                        <div className="expand-collapse">
                            <div>
                                <div className="locator-filter">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="locator-subtitle"
                                        onClick={() => this.setState({
                                            isAreasOpen: !this.state.isAreasOpen,
                                        })}
                                    >
                                        <FormattedMessage id="macroplanning.label.unUsedAreas" defaultMessage="Aire(s) de santé non assignées" />
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
                                            disabled
                                            multi
                                            clearable={false}
                                            name="unUsedAreas"
                                            value={this.state.unUsedAreas}
                                            placeholder="--"
                                            options={areas.features.map(area =>
                                                ({ label: area.properties.name, value: area.properties.pk }))}
                                        />
                                    </div>
                                </div>
                            </div>
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
    workZones: PropTypes.arrayOf(PropTypes.object),
    selectWorkZone: PropTypes.func.isRequired,
    saveWorkZoneColor: PropTypes.func.isRequired,
    selectedWorkZoneId: PropTypes.number,
    currentCoordination: PropTypes.object,
    assignToWorkZone: PropTypes.func.isRequired,
};

export default injectIntl(WorkZonesSelect);
