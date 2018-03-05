import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../../components/loading-spinner';
import VideoValidatorComponent from '../components/VideoValidatorComponent';
import { getRequest } from '../../../utils/fetchData';
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


    updateVideoList() {
        const url = '/api/qctests/?type=PG&limit=1&checked=false';
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
                                onClick={() => this.props.goBack()}
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
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    videoList: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
};

const QualityVideosIntl = injectIntl(QualityVideos);

const MapStateToProps = state => ({
    load: state.load,
    videoList: state.videoList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    goBack: () => dispatch(push('/')),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityVideosIntl);
