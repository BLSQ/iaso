import React, { Component, Fragment } from 'react';
import { injectIntl } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Grid from '@material-ui/core/Grid';

import { periodTypes } from '../../../constants/filters';
import { setInstanceStatus } from '../../../redux/instancesReducer';

import FiltersComponent from '../../../components/filters/FiltersComponent';
import ChipsListComponent from '../../../components/chips/ChipsListComponent';


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
            instanceStatus,
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
                    <Grid item xs={3} />
                    <Grid item container xs={6} justify="flex-end">
                        <ChipsListComponent
                            chipsList={instanceStatus}
                            handleListChange={chipsList => this.props.setInstanceStatus(chipsList)}
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
    instanceStatus: PropTypes.array.isRequired,
    setInstanceStatus: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    periodTypesList: state.periods.periodTypes,
    instanceStatus: state.instances.instanceStatus,
});


const MapDispatchToProps = dispatch => ({
    dispatch,
    setInstanceStatus: instanceStatus => dispatch(setInstanceStatus(instanceStatus)),
});

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(CompletenessFiltersComponent));
