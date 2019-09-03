import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';


import { withStyles } from '@material-ui/core';

import commonStyles from '../../styles/common';

import FiltersComponent from './FiltersComponent';

import { fetchOrgUnits } from '../../utils/requests';

const styles = theme => ({
    ...commonStyles(theme),
});

class OrgUnitsLevelsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentWillMount() {
        const { dispatch } = this.props;
        fetchOrgUnits(dispatch, '&root=true').then(orgUnits => console.log(orgUnits));
    }

    onFilterChanged() {
        console.log('do something');
    }

    render() {
        const {
            params,
            baseUrl,
            classes,
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <div>
                <FiltersComponent
                    params={params}
                    baseUrl={baseUrl}
                    onFilterChanged={() => this.onFilterChanged()}
                    filters={[
                        device(devices),
                        deviceOwnership(devicesOwnerships),
                    ]}
                />
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
    baseUrl: PropTypes.string,
};

const MapStateToProps = state => ({
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(
    withStyles(styles)(injectIntl(OrgUnitsLevelsFiltersComponent)),
);
