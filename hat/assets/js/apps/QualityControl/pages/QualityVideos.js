import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import VideoValidatorComponent from '../components/VideoValidatorComponent';

import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { getRequest, createUrl } from '../../../utils/fetchData';
import { saveTest } from '../../../utils/saveData';
import { videoActions } from '../redux/video';

class QualityVideos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.updateVideoList();
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.params.date_from !== this.props.params.date_from) ||
            (nextProps.params.date_to !== this.props.params.date_to)) {
            this.updateVideoList(
                nextProps.params.date_from,
                nextProps.params.date_to,
            );
        }
    }

    updateVideoList(from = this.props.params.date_from, to = this.props.params.date_to) {
        const url = `/api/qctests/?type=PG&limit=1&checked=false&from=${from}&to=${to}`;
        getRequest(url, this.props.dispatch).then((response) => {
            this.props.dispatch(videoActions.setVideoList(response));
        });
    }

    saveTestItem(test) {
        saveTest(test, this.props.dispatch).then((isSaved) => {
            if (isSaved) {
                this.updateVideoList();
            }
        });
    }

    render() {
        if (!this.props.videoList) {
            return null;
        }
        const { loading, error } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <div className="widget__container quality-control">
                {
                    loading &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <section>
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <button
                                className="button--small"
                                onClick={() =>
                                    this.props.redirectTo('', {
                                        date_from: this.props.params.date_from,
                                        date_to: this.props.params.date_to,
                                    })}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>
                            {
                                !this.props.videoList.results[0] &&
                                <section>
                                    <FormattedMessage
                                        id="quality.video.novideo"
                                        defaultMessage="Aucune video trouvée"
                                    />
                                </section>
                            }

                            {
                                this.props.videoList.results[0] &&
                                <section>
                                    <FormattedMessage
                                        id="quality.label.rest"
                                        defaultMessage="Reste"
                                    />
                                    <span>
                                        {` ${this.props.videoList.remaining_count} `}
                                    </span>
                                    <FormattedMessage
                                        id="quality.label.videotockeck"
                                        defaultMessage="video(s) à vérifier"
                                    />
                                </section>
                            }
                            <PeriodSelectorComponent
                                dateFrom={this.props.params.date_from}
                                dateTo={this.props.params.date_to}
                                onChangeDate={(dateFrom, dateTo) =>
                                    this.props.redirectTo('videos', {
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>
                    </div>

                    {
                        this.props.videoList.results[0] &&
                        <VideoValidatorComponent
                            videoItem={this.props.videoList.results[0]}
                            saveTest={test => this.saveTestItem(test)}
                            error={error}
                        />
                    }
                </section>
            </div>);
    }
}

QualityVideos.defaultProps = {
    videoList: null,
};

QualityVideos.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    videoList: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
};

const QualityVideosIntl = injectIntl(QualityVideos);

const MapStateToProps = state => ({
    load: state.load,
    videoList: state.videoList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityVideosIntl);
