import React, { Component, Fragment } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';


import { withStyles } from '@material-ui/core';

import commonStyles from '../../styles/common';

import FiltersComponent from './FiltersComponent';

import { fetchOrgUnits } from '../../utils/requests';
import { createUrl } from '../../../../utils/fetchData';

import { orgUnitLevel } from '../../constants/filters';
import { setOrgUnitsLevel } from '../../redux/orgUnitsLevelsReducer';

const styles = theme => ({
    ...commonStyles(theme),
});

class OrgUnitsLevelsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orgUnitLevelsIds: props.params.orgUnitLevelsIds ? props.params.orgUnitLevelsIds.split(',') : [],
        };
    }

    componentWillMount() {
        this.fetchTree(0);
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
        newOrgUnitLevelsIds[level] = value;
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
                if (orgUnits.length > 0) {
                    this.props.setOrgUnitsLevel(orgUnits, level + 1);
                }
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
        fetchOrgUnits(dispatch, `&parent_id=${orgUnitLevelsIds[level] || level}`).then((orgUnits) => {
            this.props.setOrgUnitsLevel(orgUnits, level);
            // if (orgUnitLevelsIds[level]) {
            //     this.fetchTree(level + 1);
            // }
        });
    }

    render() {
        const {
            params,
            baseUrl,
            classes,
            intl: {
                formatMessage,
            },
            orgUnitsLevels,
        } = this.props;
        const {
            orgUnitLevelsIds,
        } = this.state;
        return (
            <div>
                {
                    orgUnitsLevels.map((level, index) => {
                        const currentValue = orgUnitLevelsIds[index] ? parseInt(orgUnitLevelsIds[index], 10) : null;
                        return (
                            <Fragment key={`level-${index}`}>
                                {currentValue}
                                {/* {
                                    orgUnitsLevels[index]
                                    && (
                                        <FiltersComponent
                                            params={params}
                                            baseUrl={baseUrl}
                                            filters={[
                                                orgUnitLevel(
                                                    orgUnitsLevels[index],
                                                    index,
                                                    value => this.onFilterChanged(value, index),
                                                    currentValue,
                                                ),
                                            ]}
                                        />
                                    )
                                } */}
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    filters={[
                                        orgUnitLevel(
                                            orgUnitsLevels[index] || [],
                                            index,
                                            value => this.onFilterChanged(value, index),
                                            currentValue,
                                        ),
                                    ]}
                                />
                            </Fragment>
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
    classes: PropTypes.object.isRequired,
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

export default connect(MapStateToProps, MapDispatchToProps)(
    withStyles(styles)(injectIntl(OrgUnitsLevelsFiltersComponent)),
);
