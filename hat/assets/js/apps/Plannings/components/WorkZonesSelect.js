/*
 * This component displays the list of selected villages. It also allows to
 * remove (`deselect`) them from the list (one by one or all together),
 * or to identify the selected village in the the map (`show`).
 */

import React, { Component } from 'react';
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

class WorkZonesSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            workZones: props.workZones,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            workZones: nextProps.workZones,
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

    render() {
        const {
            intl: {
                formatMessage,
            },
            saveWorkZoneColor,
            selectWorkZone,
            selectedWorkZoneId,
        } = this.props;
        const { workZones } = this.state;
        return (
            <div>
                <ul className="workzones-list" onMouseLeave={() => this.toggleColors()}>
                    {
                        workZones.map((w, index) =>
                            (
                                <li key={w.id} className={`workzones-item ${selectedWorkZoneId === w.id ? 'selected' : ''}`}>
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
                                    </div>
                                    <div className={`color-picker-container${w.showColor ? ' visible' : ''}`} >
                                        <GithubPicker
                                            width={`${26.2 * workZonesColors.length}px`}
                                            colors={workZonesColors}
                                            color={w.color ? w.color : workZonesColors[index]}
                                            onChangeComplete={color => saveWorkZoneColor(color.hex, w.id)}
                                        />
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
};

WorkZonesSelect.propTypes = {
    intl: PropTypes.object.isRequired,
    workZones: PropTypes.arrayOf(PropTypes.object),
    selectWorkZone: PropTypes.func.isRequired,
    saveWorkZoneColor: PropTypes.func.isRequired,
    selectedWorkZoneId: PropTypes.number,
};

export default injectIntl(WorkZonesSelect);
