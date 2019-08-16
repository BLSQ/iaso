import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { currentUserActions } from '../../../redux/currentUserReducer';
import CustomTableComponent from '../../../components/CustomTableComponent';
import detailMonitoringColumns from '../constants/detailMonitoringColumns';

class QualityDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userLevel: null,
        };
    }

    componentDidMount() {
        if (!this.props.currentUser.username) {
            this.props.fetchCurrentUserInfos();
        }
    }

    componentWillReceiveProps(nextProps) {
        const newState = {};
        if (nextProps.currentUser) {
            newState.userLevel = nextProps.currentUser.level;
        }

        this.setState(newState);
    }

    goBack() {
        const newParams = {
            ...this.props.params,
        };
        newParams.back = true;
        delete newParams.userId;
        this.props.redirectTo('monitoring', newParams);
    }


    render() {
        const {
            load: { loading },
            params,
            intl: { formatMessage },
        } = this.props;
        const {
            userLevel,
        } = this.state;
        const { userId } = params;
        return (
            <div className="widget__container quality-control">
                {
                    (loading || !userLevel) &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Loading',
                        id: 'main.label.loading',
                    })}
                    />
                }
                <section>
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <button
                                className="button--small"
                                onClick={() => this.goBack()}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>
                            {
                                <FormattedMessage
                                    id="qc.detail.label"
                                    defaultMessage="Quality control detail"
                                />
                            }
                        </h2>
                    </div>

                </section>
                <CustomTableComponent
                    showPagination={false}
                    endPointUrl={`/api/qcdetails/${userId}/?from=${params.date_from}&to=${params.date_to}`}
                    columns={detailMonitoringColumns(this.props.intl.formatMessage)}
                    defaultSorted={[{ id: 'created_at', desc: false }]}
                    params={params}
                    orderKey="created_at"
                    multiSort
                    withBorder={false}
                    isSortable={false}
                    canSelect={false}
                    dataKey="tests"
                />
            </div>);
    }
}

QualityDetail.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const QualityDetailIntl = injectIntl(QualityDetail);

const MapStateToProps = state => ({
    load: state.load,
    currentUser: state.currentUser.user,
});

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDetailIntl);
