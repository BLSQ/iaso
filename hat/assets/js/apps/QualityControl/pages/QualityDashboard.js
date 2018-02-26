import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css';
import { createUrl, getRequest } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import { dashboardActions } from '../redux/dashboard';

class QualityDashboard extends React.Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        this.state = {
            dateFrom: moment(props.params.date_from),
            dateTo: moment(props.params.date_to),
            dateFormat: 'YYYY-MM-DD',
        };
    }

    componentDidMount() {
        this.updateDashboardInfos();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            dateFrom: moment(nextProps.params.date_from),
            dateTo: moment(nextProps.params.date_to),
        });
        if ((nextProps.params.date_from !== this.props.params.date_from) ||
            (nextProps.params.date_to !== this.props.params.date_to)) {
            this.updateDashboardInfos();
        }
    }

    onChangeDate(date, key) {
        this.props.redirectTo('', {
            ...this.props.params,
            [key]: moment(date).format(this.state.dateFormat),
        });
    }

    updateDashboardInfos() {
        const url = `/api/qcstats?from=${this.props.params.date_from}&to=${this.props.params.date_to}`;
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
                                Dashboard:
                                <div className="filter__container__select date-select">
                                    <label
                                        htmlFor="date-from"
                                        className="filter__container__select__label"
                                    >
                                        <i className="fa fa-calendar" />
                                        <FormattedMessage
                                            id="statspage.label.datefrom"
                                            defaultMessage="From"
                                        />
                                    </label>
                                    <DatePicker
                                        dateFormat={this.state.dateFormat}
                                        dateFormatCalendar={this.state.dateFormat}
                                        selected={this.state.dateFrom}
                                        onChange={date => this.onChangeDate(date, 'date_from')}
                                        maxDate={this.state.dateTo}
                                    />
                                </div>
                                <div className="filter__container__select date-select">
                                    <label
                                        htmlFor="date-to"
                                        className="filter__container__select__label"
                                    >
                                        <i className="fa fa-calendar" />
                                        <FormattedMessage
                                            id="statspage.label.dateto"
                                            defaultMessage="To"
                                        />
                                    </label>
                                    <DatePicker
                                        dateFormat={this.state.dateFormat}
                                        dateFormatCalendar={this.state.dateFormat}
                                        selected={this.state.dateTo}
                                        minDate={this.state.dateFrom}
                                        onChange={date => this.onChangeDate(date, 'date_to')}
                                    />
                                </div>
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
                                    <button className="button--small" onClick={() => this.props.redirectTo('/videos', {})}>
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
                                    <button className="button--small" onClick={() => this.props.redirectTo('/images', {})}>
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
                            <button className="button--small" onClick={() => this.props.redirectTo('/stats', {})}>
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
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params).replace('/charts', '')}`)),
    getDashboardInfos: url => getRequest(url, dispatch).then((response) => {
        dispatch(dashboardActions.setDashboardInfo(response));
    }),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDashboardIntl);
