import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import {
    withStyles, Box,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchCompleteness,
    fetchPeriodTypes,
    fetchIsntanceStatus,
} from '../utils/requests';

import {
    setCompletenessData,
    setIsFetching,
    setInstanceStatus,
} from '../redux/completenessReducer';
import {
    setPeriodTypes,
} from '../redux/periodsReducer';

import { sortPeriods, sortPeriodTypes } from '../utils/periodsUtils';

import TopBar from '../components/nav/TopBarComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import CompletenessPeriodComponent from '../components/completeness/CompletenessPeriodComponent';
import CompletenessFiltersComponent from '../components/filters/CompletenessFiltersComponent';

import commonStyles from '../styles/common';

const baseUrl = 'completeness';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Completeness extends Component {
    componentWillMount() {
        const {
            dispatch,
            intl: {
                formatMessage,
            },
        } = this.props;
        fetchPeriodTypes(dispatch)
            .then(res => this.props.setPeriodTypes(sortPeriodTypes(res.period_types)));
        fetchIsntanceStatus(dispatch)
            .then(res => this.props.setInstanceStatus(res.instance_status.map(s => ({
                key: s[0],
                isVisible: true,
                label: formatMessage({
                    defaultMessage: s[0],
                    id: `iaso.completeness.${s[0]}Multi`,
                }),
            }))));
        this.getData();
    }

    componentDidUpdate(prevProps) {
        const { params: { periodType } } = this.props;
        if (periodType && periodType !== prevProps.params.periodType) {
            this.getData();
        }
    }

    getData() {
        const {
            dispatch,
        } = this.props;
        this.props.setIsFetching(true);
        fetchCompleteness(dispatch, this.getendPointUrl())
            .then((res) => {
                this.props.setCompletenessData(sortPeriods(res));
                this.props.setIsFetching(false);
            });
    }

    getendPointUrl() {
        const { periodType } = this.props.params;
        const url = `/api/completeness/?period_type=${periodType}`;
        return url;
    }

    render() {
        const {
            classes,
            params,
            intl: {
                formatMessage,
            },
            fetching,
            completenessData,
            instanceStatus,
        } = this.props;
        if (!completenessData) return null;
        return (
            <Fragment>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <TopBar
                    title={formatMessage({
                        defaultMessage: 'Completeness',
                        id: 'iaso.completeness.title',
                    })}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>

                    <CompletenessFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.onSearch()}
                    />
                    <div className={classes.marginTop}>
                        {
                            completenessData.map(d => (
                                <CompletenessPeriodComponent
                                    key={d.period}
                                    period={d.period}
                                    forms={d.forms}
                                    instanceStatus={instanceStatus}
                                />
                            ))
                        }
                    </div>
                </Box>
            </Fragment>
        );
    }
}

Completeness.defaultProps = {
    completenessData: null,
};

Completeness.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    setCompletenessData: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    completenessData: PropTypes.object,
    setPeriodTypes: PropTypes.func.isRequired,
    setIsFetching: PropTypes.func.isRequired,
    setInstanceStatus: PropTypes.func.isRequired,
    instanceStatus: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    completenessData: state.completeness.data,
    fetching: state.completeness.fetching,
    instanceStatus: state.completeness.instanceStatus,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setPeriodTypes: periodTypes => dispatch(setPeriodTypes(periodTypes)),
    setCompletenessData: data => dispatch(setCompletenessData(data)),
    setIsFetching: isFetching => dispatch(setIsFetching(isFetching)),
    setInstanceStatus: instanceStatus => dispatch(setInstanceStatus(instanceStatus)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Completeness)),
);
