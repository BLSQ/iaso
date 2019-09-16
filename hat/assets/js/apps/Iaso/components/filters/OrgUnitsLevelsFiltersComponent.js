import React, { Component } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import PropTypes from 'prop-types';

import OrgUnitLevelFilterComponent from './OrgUnitLevelFilterComponent';

import { fetchOrgUnits } from '../../utils/requests';
import { createUrl } from '../../../../utils/fetchData';
import { fetchLatestOrgUnitLevelId } from '../../utils/orgUnitUtils';

import { setOrgUnitsLevel } from '../../redux/orgUnitsLevelsReducer';

class OrgUnitsLevelsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            levels: [],
        };
    }

    componentDidMount() {
        this.fetchAllTree();
    }

    componentDidUpdate(prevProps) {
        const levels = this.props.params[this.props.paramKey];
        const prevLevels = prevProps.params[prevProps.paramKey];
        if (levels && !prevLevels) {
            this.fetchAllTree();
        } else {
            const lastLevel = fetchLatestOrgUnitLevelId(this.props.params[this.props.paramKey]);
            const prevLastLevel = fetchLatestOrgUnitLevelId(prevProps.params[prevProps.paramKey]);
            if (lastLevel !== prevLastLevel && levels) {
                const levelIndex = levels.split(',').indexOf(lastLevel.toString()) + 1;
                this.fetchTree(levelIndex);
            }
        }
    }

    onFilterChanged(value, level) {
        const {
            params,
            redirectTo,
            baseUrl,
            orgUnitsLevels,
            paramKey,
            onLatestIdChanged,
        } = this.props;
        onLatestIdChanged(value);
        const {
            levels,
        } = this.state;
        const newOrgUnitLevelsIds = [];
        orgUnitsLevels.forEach((o, i) => {
            if (parseInt(i, 10) < level) {
                const l = levels[i];
                newOrgUnitLevelsIds.push(l);
            } else if (parseInt(i, 10) > level) {
                this.props.setOrgUnitsLevel(null, i);
            }
        });
        if (value) {
            newOrgUnitLevelsIds[level] = value;
        }
        this.setState({
            levels: newOrgUnitLevelsIds,
        });
        const newParams = {
            ...params,
            [paramKey]: newOrgUnitLevelsIds.toString(),
        };
        redirectTo(baseUrl, newParams);
    }

    fetchAllTree() {
        const levels = this.props.params[this.props.paramKey] ? this.props.params[this.props.paramKey].split(',') : [];
        this.setState({
            levels,
        });
        const {
            dispatch,
            showCurrentOrgUnit,
            currentOrgUnitId,
        } = this.props;
        return fetchOrgUnits(dispatch, '&parent_id=0').then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, 0);
            if (levels[0]) {
                if (showCurrentOrgUnit !== false
                    || (showCurrentOrgUnit === false && parseInt(levels[0], 10) !== currentOrgUnitId)) {
                    this.fetchTree(1);
                }
            }
        });
    }

    fetchTree(level) {
        const {
            dispatch,
            showCurrentOrgUnit,
            currentOrgUnitId,
        } = this.props;
        const {
            levels,
        } = this.state;
        return fetchOrgUnits(dispatch, `&parent_id=${levels[level - 1]}`).then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, level);
            if (levels[level]) {
                if (showCurrentOrgUnit !== false
                    || (showCurrentOrgUnit === false && parseInt(levels[level], 10) !== currentOrgUnitId)) {
                    this.fetchTree(level + 1);
                }
            }
        });
    }

    render() {
        const {
            params,
            baseUrl,
            orgUnitsLevels,
            showCurrentOrgUnit,
            currentOrgUnitId,
        } = this.props;
        const {
            levels,
        } = this.state;
        return (
            <div>
                {
                    orgUnitsLevels.map((level, index) => {
                        if (!orgUnitsLevels[index]
                            || (orgUnitsLevels[index] && orgUnitsLevels[index].length === 0)) return null;
                        return (
                            <OrgUnitLevelFilterComponent
                                key={`level-${orgUnitsLevels[index][0].id}`}
                                params={params}
                                baseUrl={baseUrl}
                                levelId={levels[index] ? parseInt(levels[index], 10) : undefined}
                                levelIndex={index}
                                onFilterChanged={value => this.onFilterChanged(value, index)}
                                orgUnits={orgUnitsLevels[index]}
                                showCurrentOrgUnit={showCurrentOrgUnit}
                                currentOrgUnitId={currentOrgUnitId}
                            />
                        );
                    })
                }
            </div>
        );
    }
}
OrgUnitsLevelsFiltersComponent.defaultProps = {
    baseUrl: '',
    paramKey: 'levels',
    showCurrentOrgUnit: true,
    currentOrgUnitId: null,
};

OrgUnitsLevelsFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsLevel: PropTypes.func.isRequired,
    baseUrl: PropTypes.string,
    orgUnitsLevels: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
    onLatestIdChanged: PropTypes.func.isRequired,
    paramKey: PropTypes.string,
    showCurrentOrgUnit: PropTypes.bool,
    currentOrgUnitId: PropTypes.any,
};

const MapStateToProps = state => ({
    fetching: state.orgUnitsLevels.fetching,
    orgUnitsLevels: state.orgUnitsLevels.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitsLevel: (orgUnitItem, level) => dispatch(setOrgUnitsLevel(orgUnitItem, level)),
});

export default connect(MapStateToProps, MapDispatchToProps)(OrgUnitsLevelsFiltersComponent);
