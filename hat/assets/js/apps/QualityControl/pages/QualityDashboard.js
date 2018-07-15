import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { createUrl, getRequest } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { dashboardActions } from '../redux/dashboard';

class QualityDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.updateDashboardInfos();
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.params.date_from !== this.props.params.date_from) ||
            (nextProps.params.date_to !== this.props.params.date_to)) {
            this.updateDashboardInfos(nextProps.params.date_from, nextProps.params.date_to);
        }
    }
    updateDashboardInfos(from = this.props.params.date_from, to = this.props.params.date_to) {
        const url = `/api/qcstats?from=${from}&to=${to}`;
        this.props.getDashboardInfos(url);
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <div className="widget__container">
                {
                    loading &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                {
                    this.props.infos &&
                    <section>
                        <div className="widget__header">
                            <h2 className="widget__heading">
                                <PeriodSelectorComponent
                                    dateFrom={this.props.params.date_from}
                                    dateTo={this.props.params.date_to}
                                    onChangeDate={(dateFrom, dateTo) =>
                                        this.props.redirectTo('', {
                                            date_from: dateFrom,
                                            date_to: dateTo,
                                        })}
                                />
                            </h2>
                        </div>
                        <div className="widget__content--flex">
                            <div className="quality-control-element">
                                <h3>
                                    <FormattedMessage
                                        id="quality.label.videos"
                                        defaultMessage="Vidéos"
                                    />
                                </h3>
                                <p>
                                    {`${this.props.infos.videos.no_checks_count} `}
                                    <FormattedMessage
                                        id="quality.label.tockeck"
                                        defaultMessage="à vérifier"
                                    />
                                </p>
                                <p>
                                    {`${this.props.infos.videos.checks_count} `}
                                    <FormattedMessage
                                        id="quality.label.checked"
                                        defaultMessage="vérifiées"
                                    />
                                </p>
                                <p className={this.props.infos.videos.mismatch_count > 0 ? 'with-problems' : ''}>
                                    {`${this.props.infos.videos.mismatch_count} `}
                                    <FormattedMessage
                                        id="quality.label.withproblems"
                                        defaultMessage="avec problèmes"
                                    />
                                </p>
                                {
                                    this.props.infos.videos.no_checks_count > 0 &&
                                    <button className="button--small" onClick={() => this.props.redirectTo('/videos', this.props.params)}>
                                        <i className="fa fa-video-camera" />
                                        <FormattedMessage
                                            id="quality.label.checkvideo"
                                            defaultMessage="Vérifier les videos"
                                        />
                                    </button>
                                }
                            </div>
                            <div className="quality-control-element">
                                <h3>
                                    <FormattedMessage
                                        id="quality.label.images"
                                        defaultMessage="Images"
                                    />
                                </h3>
                                <p>
                                    {`${this.props.infos.images.no_checks_count} `}
                                    <FormattedMessage
                                        id="quality.label.tockeck"
                                        defaultMessage="à vérifier"
                                    />
                                </p>
                                <p>
                                    {`${this.props.infos.images.checks_count} `}
                                    <FormattedMessage
                                        id="quality.label.checked"
                                        defaultMessage="vérifiées"
                                    />
                                </p>
                                <p className={this.props.infos.images.mismatch_count > 0 ? 'with-problems' : ''}>
                                    {`${this.props.infos.images.mismatch_count} `}
                                    <FormattedMessage
                                        id="quality.label.withproblems"
                                        defaultMessage="avec problèmes"
                                    />
                                </p>
                                {
                                    this.props.infos.images.no_checks_count > 0 &&
                                    <button className="button--small" onClick={() => this.props.redirectTo('/images', this.props.params)}>
                                        <i className="fa fa-picture-o" />
                                        <FormattedMessage
                                            id="quality.label.checkimages"
                                            defaultMessage="Vérifier les images"
                                        />
                                    </button>
                                }
                            </div>
                        </div>
                        <div className="widget__content no-padding-top">
                            <button
                                className="button--small"
                                onClick={() => this.props.redirectTo('/stats', {
                                    ...this.props.params,
                                    order: 'id',
                                })}
                            >
                                <i className="fa fa-calculator" />
                                <FormattedMessage
                                    id="quality.label.stats"
                                    defaultMessage="Voir les statistiques"
                                />
                            </button>
                        </div>
                    </section>
                }
            </div>
        );
    }
}

QualityDashboard.defaultProps = {
    infos: null,
};

QualityDashboard.propTypes = {
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    getDashboardInfos: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    infos: PropTypes.object,
};

const QualityDashboardIntl = injectIntl(QualityDashboard);

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
});

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    getDashboardInfos: url => getRequest(url, dispatch).then((response) => {
        dispatch(dashboardActions.setDashboardInfo(response));
    }),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDashboardIntl);
