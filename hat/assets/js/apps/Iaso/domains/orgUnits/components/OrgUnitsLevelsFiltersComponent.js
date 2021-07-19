import React, { Component } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import Box from '@material-ui/core/Box';

import PropTypes from 'prop-types';

import { createUrl } from 'bluesquare-components';
import OrgUnitLevelFilterComponent from './OrgUnitLevelFilterComponent';

import { fetchOrgUnits } from '../../../utils/requests';
import { fetchLatestOrgUnitLevelId, decodeSearch } from '../utils';

import { setOrgUnitsLevel } from '../../../redux/orgUnitsLevelsReducer';

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
        const { searchIndex } = this.props;
        let levels;
        let prevLevels;
        let prevSource;
        let newSource;
        let prevValidated = prevProps.params.validated;
        let newValidated = this.props.params.validated;
        if (searchIndex || searchIndex === 0) {
            const searches = decodeSearch(this.props.params.searches);
            const prevSearches = decodeSearch(prevProps.params.searches);
            levels = searches[searchIndex][this.props.paramKey];
            prevLevels = prevSearches[searchIndex][prevProps.paramKey];
            prevSource = prevSearches[searchIndex].source;
            newSource = searches[searchIndex].source;
            prevValidated = prevSearches[searchIndex].validated;
            newValidated = searches[searchIndex].validated;
        } else {
            levels = this.props.params[this.props.paramKey];
            prevLevels = prevProps.params[prevProps.paramKey];
            prevSource = prevProps.params.source;
            newSource = this.props.params.source;
            prevValidated = prevProps.params.validated;
            newValidated = this.props.params.validated;
        }
        const importantParamsChanged =
            prevSource !== newSource || prevValidated !== newValidated;
        if (importantParamsChanged) {
            this.resetLevels();
        }

        if ((levels && !prevLevels) || importantParamsChanged) {
            this.fetchAllTree();
        } else {
            const lastLevel = fetchLatestOrgUnitLevelId(levels);
            const prevLastLevel = fetchLatestOrgUnitLevelId(prevLevels);
            if (lastLevel !== prevLastLevel && levels) {
                const levelIndex =
                    levels.split(',').indexOf(lastLevel.toString()) + 1;
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
            onLevelsChange,
            searchIndex,
        } = this.props;
        const { levels } = this.state;
        const newOrgUnitLevelsIds = [];
        orgUnitsLevels.forEach((o, i) => {
            if (parseInt(i, 10) < level) {
                const l = levels[i];
                newOrgUnitLevelsIds.push(l);
            } else if (parseInt(i, 10) > level) {
                this.props.setOrgUnitsLevel(null, i, searchIndex);
            }
        });
        if (value) {
            newOrgUnitLevelsIds[level] = value;
        }
        this.setState({
            levels: newOrgUnitLevelsIds,
        });
        if (searchIndex || searchIndex === 0) {
            onLevelsChange(newOrgUnitLevelsIds.toString());
        } else {
            onLatestIdChanged(value);
            const newParams = {
                ...params,
                [paramKey]: newOrgUnitLevelsIds.toString(),
            };
            redirectTo(baseUrl, newParams);
        }
    }

    resetLevels() {
        this.setState({
            levels: [],
        });
    }

    buildUrl(base) {
        const {
            params: { version },
            searchIndex,
            defaultVersion,
        } = this.props;
        let source;
        if (searchIndex || searchIndex === 0) {
            const searches = decodeSearch(this.props.params.searches);
            source = searches[searchIndex].source || this.props.source;
        } else {
            source = this.props.params.source || this.props.source;
        }
        let url = base;
        if (source) {
            url = `${url}&source=${source}`;
        }
        if (version) {
            url = `${url}&version=${version}`;
        }
        if (defaultVersion) {
            url = `${url}&defaultVersion=true`;
        }
        url = `${url}&validation_status=all`;
        return url;
    }

    fetchAllTree() {
        const { dispatch, showCurrentOrgUnit, currentOrgUnitId, searchIndex } =
            this.props;
        let levels;
        if (searchIndex || searchIndex === 0) {
            const searches = decodeSearch(this.props.params.searches);
            levels = searches[searchIndex][this.props.paramKey]
                ? searches[searchIndex][this.props.paramKey].split(',')
                : [];
        } else {
            levels = this.props.params[this.props.paramKey]
                ? this.props.params[this.props.paramKey].split(',')
                : [];
        }
        this.setState({
            levels,
        });

        return fetchOrgUnits(
            dispatch,
            this.buildUrl('&rootsForUser=true&ignoreEmptyNames=true'),
        ).then(orgUnits => {
            this.props.setOrgUnitsLevel(orgUnits, 0, searchIndex);
            if (levels[0]) {
                if (
                    showCurrentOrgUnit !== false ||
                    (showCurrentOrgUnit === false &&
                        parseInt(levels[0], 10) !== currentOrgUnitId)
                ) {
                    this.fetchTree(1);
                }
            }
        });
    }

    fetchTree(level) {
        const { dispatch, showCurrentOrgUnit, currentOrgUnitId, searchIndex } =
            this.props;
        const { levels } = this.state;
        const parentId = levels[level - 1];
        if (parentId) {
            const base = `&parent_id=${parentId}`;

            return fetchOrgUnits(dispatch, this.buildUrl(base)).then(
                orgUnits => {
                    this.props.setOrgUnitsLevel(orgUnits, level, searchIndex);
                    if (levels[level]) {
                        if (
                            showCurrentOrgUnit !== false ||
                            (showCurrentOrgUnit === false &&
                                parseInt(levels[level], 10) !==
                                    currentOrgUnitId)
                        ) {
                            this.fetchTree(level + 1);
                        }
                    }
                },
            );
        }
        return null;
    }

    render() {
        const {
            params,
            baseUrl,
            orgUnitsLevels,
            showCurrentOrgUnit,
            currentOrgUnitId,
        } = this.props;
        const { levels } = this.state;
        return (
            <Box mb={2}>
                {orgUnitsLevels.map((level, index) => {
                    if (
                        !orgUnitsLevels[index] ||
                        (orgUnitsLevels[index] &&
                            orgUnitsLevels[index].length === 0)
                    )
                        return null;

                    return (
                        <OrgUnitLevelFilterComponent
                            key={`level-${
                                orgUnitsLevels[index][0]
                                    ? orgUnitsLevels[index][0].id
                                    : '0'
                            }`}
                            params={params}
                            baseUrl={baseUrl}
                            levelId={
                                levels[index]
                                    ? parseInt(levels[index], 10)
                                    : undefined
                            }
                            levelIndex={index}
                            onFilterChanged={value =>
                                this.onFilterChanged(value, index)
                            }
                            orgUnits={orgUnitsLevels[index]}
                            showCurrentOrgUnit={showCurrentOrgUnit}
                            currentOrgUnitId={currentOrgUnitId}
                        />
                    );
                })}
            </Box>
        );
    }
}
OrgUnitsLevelsFiltersComponent.defaultProps = {
    baseUrl: '',
    paramKey: 'levels',
    showCurrentOrgUnit: true,
    currentOrgUnitId: null,
    source: null,
    searchIndex: null,
    orgUnitsLevels: [],
    onLevelsChange: () => ({}),
    onLatestIdChanged: () => ({}),
    defaultVersion: false,
};

OrgUnitsLevelsFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsLevel: PropTypes.func.isRequired,
    baseUrl: PropTypes.string,
    orgUnitsLevels: PropTypes.array,
    redirectTo: PropTypes.func.isRequired,
    onLatestIdChanged: PropTypes.func,
    paramKey: PropTypes.string,
    showCurrentOrgUnit: PropTypes.bool,
    currentOrgUnitId: PropTypes.any,
    source: PropTypes.any,
    searchIndex: PropTypes.any,
    onLevelsChange: PropTypes.func,
    defaultVersion: PropTypes.bool,
};

const MapStateToProps = (state, props) => ({
    fetching: state.orgUnitsLevels.fetching,
    orgUnitsLevels:
        props.searchIndex || props.searchIndex === 0
            ? state.orgUnitsLevels.list[props.searchIndex]
            : state.orgUnitsLevels.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitsLevel: (orgUnitItem, level, index) =>
        dispatch(setOrgUnitsLevel(orgUnitItem, level, index)),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(OrgUnitsLevelsFiltersComponent);
