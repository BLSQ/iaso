import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import {
    withStyles, Box, Grid,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchCompleteness,
    fetchPeriodTypes,
} from '../utils/requests';

import {
    setPeriodTypes,
    setCompletenessData,
    setIsFetching,
} from '../redux/completenessReducer';

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
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentWillMount() {
        const { dispatch } = this.props;
        fetchPeriodTypes(dispatch)
            .then(periodTypes => this.props.setPeriodTypes(sortPeriodTypes(periodTypes)));
        this.getData();
    }

    componentDidUpdate(prevProps) {
        const { params: { periodType } } = this.props;
        if (periodType && periodType !== prevProps.params.periodType) {
            this.getData();
        }
    }

    getData() {
        const { dispatch } = this.props;
        this.props.setIsFetching(true);
        fetchCompleteness(dispatch, this.getendPointUrl())
            .then((res) => {
                this.props.setCompletenessData({
                    ...res,
                    data: sortPeriods(res.data),
                });
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
        } = this.props;
        if (!completenessData) return null;
        const keys = completenessData.fieldsKeys.map(fk => formatMessage({
            defaultMessage: fk,
            id: `iaso.completeness.${fk}Multi`,
        }));
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

                    <Grid container spacing={0}>
                        <Grid
                            xs={12}
                            item
                            container
                            justify="flex-end"
                            alignItems="center"
                            className={classes.marginBottom}
                        >
                            {keys.join(', ')}
                        </Grid>
                    </Grid>
                    {
                        completenessData.data.map(d => (
                            <CompletenessPeriodComponent
                                key={d.period}
                                period={d.period}
                                forms={d.forms}
                                fieldKeys={completenessData.fieldsKeys}
                            />
                        ))
                    }
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
};

const MapStateToProps = state => ({
    completenessData: state.completeness.data,
    fetching: state.completeness.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setPeriodTypes: periodTypes => dispatch(setPeriodTypes(periodTypes)),
    setCompletenessData: data => dispatch(setCompletenessData(data)),
    setIsFetching: isFetching => dispatch(setIsFetching(isFetching)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Completeness)),
);
