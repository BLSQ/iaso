import React, { Component } from 'react';
import { push } from 'react-router-redux';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FiltersComponent from './FiltersComponent';

import { fetchOrgUnits } from '../../utils/requests';
import { createUrl } from '../../../../utils/fetchData';

import { orgUnitLevel } from '../../constants/filters';
import { setOrgUnitsLevel } from '../../redux/orgUnitsLevelsReducer';

class OrgUnitsLevelsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        const levels = props.params.levels ? props.params.levels.split(',') : [];
        this.state = {
            levels,
        };
        const {
            dispatch,
        } = props;
        fetchOrgUnits(dispatch, '&parent_id=0').then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, 0);
            if (levels[0]) {
                this.fetchTree(1);
            }
        });
    }

    componentDidUpdate() {
        this.fetchLatestOrgUnit();
    }

    onFilterChanged(value, level) {
        const {
            dispatch,
            params,
            redirectTo,
            baseUrl,
        } = this.props;
        const {
            levels,
        } = this.state;
        const newOrgUnitLevelsIds = [];
        levels.forEach((l, i) => {
            if (parseInt(i, 10) < level) {
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
            levels: newOrgUnitLevelsIds.toString(),
        };
        redirectTo(baseUrl, newParams);
        if (value) {
            fetchOrgUnits(dispatch, `&parent_id=${value}`).then((orgUnits) => {
                this.props.setOrgUnitsLevel(orgUnits, level + 1);
            });
        }
    }

    fetchTree(level) {
        const {
            dispatch,
        } = this.props;
        const {
            levels,
        } = this.state;
        fetchOrgUnits(dispatch, `&parent_id=${levels[level - 1]}`).then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, level);
            if (levels[level]) {
                this.fetchTree(level + 1);
            }
        });
    }

    fetchLatestOrgUnit() {
        const {
            params: {
                levels,
            },
        } = this.props;
        if (levels) {
            const levelsIds = levels.split(',');
            const latestId = parseInt(levelsIds[levelsIds.length - 1], 10);
            console.log(latestId);
        }
    }

    render() {
        const {
            params,
            baseUrl,
            orgUnitsLevels,
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
                            <FiltersComponent
                                key={`level-${orgUnitsLevels[index][0].id}`}
                                params={params}
                                baseUrl={baseUrl}
                                filters={[
                                    orgUnitLevel(
                                        orgUnitsLevels[index] || [],
                                        index,
                                        value => this.onFilterChanged(value, index),
                                        levels[index] ? parseInt(levels[index], 10) : null,
                                    ),
                                ]}
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
};

OrgUnitsLevelsFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsLevel: PropTypes.func.isRequired,
    baseUrl: PropTypes.string,
    orgUnitsLevels: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
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
