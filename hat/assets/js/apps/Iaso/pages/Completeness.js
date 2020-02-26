import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import {
    withStyles, Box, Grid,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchCompleteness,
} from '../utils/requests';

import {
    setPeriodType,
    setCompletenessData,
} from '../redux/completenessReducer';

import TopBar from '../components/nav/TopBarComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import CompletenessPeriodComponent from '../components/completeness/CompletenessPeriodComponent';


import commonStyles from '../styles/common';

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
        const { dispatch, periodType } = this.props;
        fetchCompleteness(dispatch, periodType)
            .then(data => this.props.setCompletenessData(data));
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
    periodType: PropTypes.string.isRequired,
    completenessData: PropTypes.object,
};

const MapStateToProps = state => ({
    completenessData: state.completeness.data,
    periodType: state.completeness.periodType,
    fetching: state.completeness.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setPeriodType: periodType => dispatch(setPeriodType(periodType)),
    setCompletenessData: data => dispatch(setCompletenessData(data)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Completeness)),
);
