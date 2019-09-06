import React, { Component } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import PropTypes from 'prop-types';

import FiltersComponent from './FiltersComponent';

import { fetchOrgUnits } from '../../utils/requests';
import { createUrl } from '../../../../utils/fetchData';
import { fetchLatestOrgUnitLevelId } from '../../utils/orgUnitUtils';

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

    componentDidUpdate(prevProps) {
        const {
            params: {
                levels,
            },
            onLatestIdChanged,
        } = this.props;
        const newLastId = fetchLatestOrgUnitLevelId(levels);
        const oldLastId = fetchLatestOrgUnitLevelId(prevProps.params.levels);
        if (newLastId !== oldLastId) {
            onLatestIdChanged(newLastId);
        }
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
        if (!value && level === 0) {
            this.props.setOrgUnitsLevel(null, 1);
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

    render() {
        const {
            params,
            baseUrl,
            orgUnitsLevels,
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            levels,
        } = this.state;
        console.log(orgUnitsLevels);
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
                                        formatMessage,
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
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsLevel: PropTypes.func.isRequired,
    baseUrl: PropTypes.string,
    orgUnitsLevels: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
    onLatestIdChanged: PropTypes.func.isRequired,
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

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitsLevelsFiltersComponent));
