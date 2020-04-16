import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import isEqual from 'lodash/isEqual';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { getSort } from '../../utils/tableUtils';

import {
    fetchUsersProfiles as fetchUsersProfilesAction,
} from './actions';

import { redirectTo as redirectToAction } from '../../routing/actions';
import TopBar from '../../components/nav/TopBarComponent';
import customTableTranslations from '../../../../utils/constants/customTableTranslations';
// import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import { baseUrls } from '../../constants/routes';

const baseUrl = baseUrls.users;

class Users extends Component {
    componentDidMount() {
        const {
            intl: { formatMessage },
            params,
            fetchUsersProfiles,
        } = this.props;
        fetchUsersProfiles(params);
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentDidUpdate(prevProps) {
        const { params, fetchUsersProfiles } = this.props;
        if (!isEqual(prevProps.params, params)) {
            fetchUsersProfiles(params);
        }
    }

    onTableParamsChange(key, value) {
        const { params, redirectTo } = this.props;
        redirectTo(baseUrl, {
            ...params,
            [key]: key !== 'order' ? value : getSort(value),
        });
    }

    selectInstance(mappingversion) {
        const { redirectTo } = this.props;
        redirectTo('forms/mapping', {
            mappingVersionId: mappingversion.id,
        });
    }

    render() {
        const {
            params,
            intl: {
                formatMessage,
            },
            redirectTo,
            profiles,
        } = this.props;
        console.log(profiles);
        return (
            <>
                {/* {
                    completeness.fetching
                    && <LoadingSpinner />
                } */}
                {/* <LoadingSpinner /> */}
                <TopBar
                    title={formatMessage({
                        defaultMessage: 'Users',
                        id: 'iaso.label.users',
                    })}
                    displayBackButton={false}
                />
            </>
        );
    }
}

Users.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    profiles: state.users.list,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchUsersProfiles: fetchUsersProfilesAction,
            redirectTo: redirectToAction,
        }, dispatch),
    }
);

export default connect(MapStateToProps, mapDispatchToProps)(injectIntl(Users));
