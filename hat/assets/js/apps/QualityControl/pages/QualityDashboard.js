import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';

import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { dashboardActions } from '../redux/dashboard';
import TabsComponent from '../../../components/TabsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import qualityColumns from '../constants/qualityColumns';
import { currentUserActions } from '../../../redux/currentUserReducer';
import FiltersComponent from '../../../components/FiltersComponent';
import { filtersTypes, filtersUsers } from '../constants/filters';
import { loadActions } from '../../../redux/load';

const baseUrl = 'dashboard';
const MESSAGES = defineMessages({
    images: {
        defaultMessage: 'Images',
        id: 'quality.label.images',
    },
    videos: {
        defaultMessage: 'Vidéos',
        id: 'quality.label.videos',
    },
});

class QualityDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'images',
            qualityColumns: qualityColumns(props.intl.formatMessage),
            imagesLoaded: false,
            videosLoaded: false,
        };
    }

    componentDidMount() {
        this.props.fetchTestMapping();
        this.props.fetchCurrentUserInfos();
        this.props.fetchProfiles();
    }

    onDataStartLoaded(key) {
        const newState = this.state;
        newState[key] = false;
        this.setState(newState);
        this.props.startLoading();
    }

    onDataLoaded(key) {
        const newState = this.state;
        newState[key] = true;
        this.setState(newState);
        if (newState.imagesLoaded && newState.videosLoaded) {
            this.props.endLoading();
        }
    }

    getEndpointUrl(mediaType, toExport = false, exportType = 'csv') {
        let url = '/api/qctests/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            from: params.date_from,
            to: params.date_to,
            media_type: mediaType,
        };
        const type = mediaType === 'image' ? params.test_type_image : params.test_type_video;
        if (type) {
            urlParams.type = type;
        }
        if (params.userId) {
            urlParams.user_ids = params.userId;
        }
        if (toExport) {
            urlParams[exportType] = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            url += `&${key}=${value}`;
        });
        return url;
    }


    render() {
        const {
            load: {
                loading,
            },
            intl: {
                formatMessage,
            },
            params,
            reduxImagePage,
            reduxVideoPage,
            setImagesList,
            setVideosList,
            profiles,
        } = this.props;
        const { currentTab } = this.state;
        return (
            <section>
                {
                    loading &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'main.labels.loading',
                    })}
                    />
                }
                <div className="widget__container">
                    <section>
                        <div className="widget__header">
                            <h2 className="widget__heading">
                                <PeriodSelectorComponent
                                    dateFrom={params.date_from}
                                    dateTo={params.date_to}
                                    onChangeDate={(dateFrom, dateTo) =>
                                        this.props.redirectTo(baseUrl, {
                                            ...params,
                                            date_from: dateFrom,
                                            date_to: dateTo,
                                        })}
                                />
                            </h2>
                        </div>
                    </section>
                </div>

                <div className="widget__container ">
                    <div className="widget__content--tier">
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={filtersTypes()}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={filtersUsers(profiles, {
                                    id: 'quality.label.tester',
                                    defaultMessage: 'Testeurs',
                                })}
                            />
                        </div>
                    </div>
                </div>
                <TabsComponent
                    defaultPath={baseUrl}
                    params={params}
                    selectTab={key => (this.setState({ currentTab: key }))}
                    tabs={[
                        { label: formatMessage(MESSAGES.images), key: 'images' },
                        { label: formatMessage(MESSAGES.videos), key: 'videos' },
                    ]}
                    defaultSelect={currentTab}
                />
                <div className="widget__container">
                    <div className={`widget__container no-border ${this.state.currentTab !== 'images' ? 'hidden' : ''}`} >
                        <CustomTableComponent
                            showPagination
                            endPointUrl={this.getEndpointUrl('image')}
                            columns={this.state.qualityColumns}
                            defaultSorted={[{ id: 'date', desc: true }]}
                            params={params}
                            defaultPath={baseUrl}
                            orderKey="imageOrder"
                            multiSort
                            withBorder={false}
                            isSortable
                            dataKey="list"
                            onRowClicked={item => this.props.redirectTo('image', {
                                test_id: item.id,
                                ...params,
                            })}
                            pageKey="imagePage"
                            pageSizeKey="imagePageSize"
                            onDataLoaded={(imagesList, count, pages) => {
                                this.onDataLoaded('imagesLoaded');
                                return setImagesList(imagesList, true, params, count, pages);
                            }}
                            reduxPage={reduxImagePage}
                            displayLoader={false}
                            onDataStartLoaded={() => this.onDataStartLoaded('imagesLoaded')}
                        />
                    </div>
                    <div className={`widget__container no-border ${this.state.currentTab !== 'videos' ? 'hidden' : ''}`} >
                        <CustomTableComponent
                            showPagination
                            endPointUrl={this.getEndpointUrl('video')}
                            columns={this.state.qualityColumns}
                            defaultSorted={[{ id: 'date', desc: true }]}
                            params={params}
                            defaultPath={baseUrl}
                            orderKey="videoOrder"
                            multiSort
                            withBorder={false}
                            isSortable
                            dataKey="list"
                            onRowClicked={item => this.props.redirectTo('video', {
                                test_id: item.id,
                                ...params,
                            })}
                            pageKey="videoPage"
                            pageSizeKey="videoPageSize"
                            onDataLoaded={(videosList, count, pages) => {
                                this.onDataLoaded('videosLoaded');
                                return setVideosList(videosList, true, params, count, pages);
                            }}
                            reduxPage={reduxVideoPage}
                            displayLoader={false}
                            onDataStartLoaded={() => this.onDataStartLoaded('videosLoaded')}
                        />
                    </div>
                </div>
            </section>
        );
    }
}

QualityDashboard.defaultProps = {
    reduxImagePage: undefined,
    reduxVideoPage: undefined,
};

QualityDashboard.propTypes = {
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchTestMapping: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    reduxImagePage: PropTypes.object,
    reduxVideoPage: PropTypes.object,
    setImagesList: PropTypes.func.isRequired,
    setVideosList: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    fetchProfiles: PropTypes.func.isRequired,
    startLoading: PropTypes.func.isRequired,
    endLoading: PropTypes.func.isRequired,
};

const QualityDashboardIntl = injectIntl(QualityDashboard);

const MapStateToProps = state => ({
    load: state.load,
    testsMapping: state.dashboard.testsMapping,
    reduxImagePage: state.dashboard.reduxImagePage,
    reduxVideoPage: state.dashboard.reduxVideoPage,
    profiles: state.dashboard.profiles,
});

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTestMapping: () => dispatch(dashboardActions.fetchTestMapping(dispatch)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    setImagesList: (imagesList, showPagination, params, count, pages) =>
        dispatch(dashboardActions.setImagesList(imagesList, showPagination, params, count, pages)),
    setVideosList: (videosList, showPagination, params, count, pages) =>
        dispatch(dashboardActions.setVideosList(videosList, showPagination, params, count, pages)),
    fetchProfiles: () => dispatch(dashboardActions.fetchProfiles(dispatch)),
    startLoading: () => dispatch(loadActions.startLoading()),
    endLoading: () => dispatch(loadActions.successLoadingNoData()),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDashboardIntl);
