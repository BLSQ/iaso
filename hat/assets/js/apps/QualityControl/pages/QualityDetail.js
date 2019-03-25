import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import ImageValidatorComponent from '../components/ImageValidatorComponent';
import VideoValidatorComponent from '../components/VideoValidatorComponent';

import { createUrl } from '../../../utils/fetchData';
import { saveTest } from '../../../utils/saveData';
import { testActions } from '../redux/test';
import { currentUserActions } from '../../../redux/currentUserReducer';

class QualityDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isImage: props.location.pathname.split('/')[0] === 'image',
            isVideo: props.location.pathname.split('/')[0] === 'video',
            userLevel: null,
            currentTest: props.currentTest,
        };
    }

    componentDidMount() {
        this.props.fetchTestDetail(this.props.params.test_id);
        if (!this.props.currentUser.username) {
            this.props.fetchCurrentUserInfos();
        }
    }

    componentWillReceiveProps(nextProps) {
        const newState = {};
        if (nextProps.currentUser) {
            newState.userLevel = nextProps.currentUser.level;
        }
        if (nextProps.currentTest) {
            newState.currentTest = nextProps.currentTest;
        }

        this.setState(newState);
    }

    saveImageItem(test, comment) {
        const promisesArray = [];
        promisesArray.push(saveTest({ result: test.result, test_id: test.id, comment }, this.props.dispatch));
        if (test.other_catt) {
            test.other_catt.forEach((item) => {
                promisesArray.push(saveTest({ result: item.result, test_id: item.id }, this.props.dispatch));
            });
        }
        Promise.all(promisesArray).then(() => {
            this.goBack();
        }).catch(error => console.error(`Error while saving test: ${error}`));
    }

    saveVideoItem(test) {
        saveTest(test, this.props.dispatch).then((isSaved) => {
            if (isSaved) {
                this.goBack();
            }
        });
    }

    goBack() {
        const newParams = {
            ...this.props.params,
        };
        delete newParams.test_id;
        this.props.redirectTo('dashboard', newParams);
    }

    render() {
        const {
            load: { loading, error },
            intl: { formatMessage },
        } = this.props;
        const {
            userLevel,
            currentTest,
            isImage,
            isVideo,
        } = this.state;

        return (
            <div className="widget__container quality-control">
                {
                    (loading || !userLevel) &&
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
                                onClick={() => this.goBack()}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>
                        </h2>
                    </div>
                    {
                        userLevel &&
                        <Fragment>
                            {
                                currentTest.id &&
                                isImage &&
                                <ImageValidatorComponent
                                    currentTest={currentTest}
                                    saveTest={(test, comment) => this.saveImageItem(test, comment)}
                                    error={error}
                                    userLevel={userLevel}
                                />
                            }
                            {
                                currentTest.id &&
                                isVideo &&
                                <VideoValidatorComponent
                                    currentTest={currentTest}
                                    saveTest={test => this.saveVideoItem(test)}
                                    error={error}
                                />
                            }
                        </Fragment>
                    }
                </section>
            </div>);
    }
}

QualityDetail.propTypes = {
    params: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchTestDetail: PropTypes.func.isRequired,
    currentTest: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
};

const QualityDetailIntl = injectIntl(QualityDetail);

const MapStateToProps = state => ({
    load: state.load,
    currentTest: state.test.currentTest,
    currentUser: state.currentUser.user,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTestDetail: id => dispatch(testActions.fetchTestDetail(dispatch, id)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDetailIntl);
