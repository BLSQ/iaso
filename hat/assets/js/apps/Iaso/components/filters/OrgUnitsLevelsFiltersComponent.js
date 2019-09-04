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
        const orgUnitLevelsIds = props.params.orgUnitLevelsIds ? props.params.orgUnitLevelsIds.split(',') : [];
        this.state = {
            orgUnitLevelsIds,
        };
        const {
            dispatch,
        } = props;
        fetchOrgUnits(dispatch, '&parent_id=0').then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, 0);
            if (orgUnitLevelsIds[0]) {
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
            orgUnitLevelsIds,
        } = this.state;
        const newOrgUnitLevelsIds = [];
        orgUnitLevelsIds.forEach((l, i) => {
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
            orgUnitLevelsIds: newOrgUnitLevelsIds,
        });
        const newParams = {
            ...params,
            orgUnitLevelsIds: newOrgUnitLevelsIds.toString(),
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
            orgUnitLevelsIds,
        } = this.state;
        fetchOrgUnits(dispatch, `&parent_id=${orgUnitLevelsIds[level - 1]}`).then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, level);
            if (orgUnitLevelsIds[level]) {
                this.fetchTree(level + 1);
            }
        });
    }

    fetchLatestOrgUnit() {
        const {
            params: {
                orgUnitLevelsIds,
            },
        } = this.props;
        const levelsIds = orgUnitLevelsIds.split(',');
        const latestId = parseInt(levelsIds[levelsIds.length - 1], 10);
        console.log(latestId);
    }

    render() {
        const {
            params,
            baseUrl,
            orgUnitsLevels,
        } = this.props;
        const {
            orgUnitLevelsIds,
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
                                        orgUnitLevelsIds[index] ? parseInt(orgUnitLevelsIds[index], 10) : null,
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
