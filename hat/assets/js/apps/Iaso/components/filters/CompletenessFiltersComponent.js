import React, { Component, Fragment } from 'react';
import { injectIntl } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import Grid from '@material-ui/core/Grid';

import {
    periodTypes,
} from '../../constants/filters';

import FiltersComponent from './FiltersComponent';

import { createUrl } from '../../../../utils/fetchData';

class CompletenessFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersUpdated: true,
        };
    }

    onFilterChanged() {
        this.setState({
            filtersUpdated: true,
        });
    }

    onSearch() {
        if (this.state.filtersUpdated) {
            this.setState({
                filtersUpdated: false,
            });
            const tempParams = {
                ...this.props.params,
            };
            tempParams.page = 1;
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
        this.props.onSearch();
    }

    render() {
        const {
            params,
            baseUrl,
            intl: {
                formatMessage,
            },
            periodTypesList,
        } = this.props;
        return (
            <Fragment>
                <Grid container spacing={4}>
                    <Grid item xs={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                periodTypes(formatMessage, periodTypesList),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                </Grid>
            </Fragment>
        );
    }
}
CompletenessFiltersComponent.defaultProps = {
    baseUrl: '',
};

CompletenessFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    periodTypesList: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    periodTypesList: state.completeness.periodTypes,
});


const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(CompletenessFiltersComponent));
