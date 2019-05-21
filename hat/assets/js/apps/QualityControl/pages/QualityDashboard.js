import React, { Fragment } from 'react';
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
import { filtersTypes, filtersUsers, filtersGeo, filtersChecked } from '../constants/filters';
import { loadActions } from '../../../redux/load';
import { filterActions } from '../../../redux/filtersRedux';
import { isSuperUser } from '../../../utils/index';
import SearchButton from '../../../components/SearchButton';

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

const req = require('superagent');

class QualityDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: props.params.tab ? props.params.tab : 'images',
            qualityColumns: qualityColumns(props.intl.formatMessage),
            imagesLoaded: props.reduxImagePage.list !== null,
            videosLoaded: props.reduxVideoPage.listt !== null,
            imageTableUrl: null,
            videoTableUrl: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo(baseUrl, params);
        }
        this.props.fetchTestMapping();
        this.props.fetchCurrentUserInfos();
        this.props.fetchProfiles();
        this.fetchProvinces().then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id);
            }
            if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            }
            if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, this.props.params.village_id, this.props.params.zs_id);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(newProps.params.province_id, newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(newProps.params.as_id, newProps.params.village_id, newProps.params.zs_id);
        }
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

    onSearch() {
        this.setState({
            imageTableUrl: this.getEndpointUrl('image'),
            videoTableUrl: this.getEndpointUrl('video'),
        });
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
        if (params.province_id) {
            urlParams.province_ids = params.province_id;
        }
        if (params.zs_id) {
            urlParams.zs_ids = params.zs_id;
        }
        if (params.as_id) {
            urlParams.as_ids = params.as_id;
        }
        if (params.only_checked_tests) {
            urlParams.checked = 'true';
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

    fetchProvinces() {
        return req
            .get('/api/provinces/')
            .then((result) => {
                this.props.loadProvinces(result.body);
            })
            .catch(err => (console.error(`Error while fetching provinces ${err}`)));
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
            geoFilters: {
                provinces,
                zones,
                areas,
            },
            currentUser,
        } = this.props;
        const { currentTab, imageTableUrl, videoTableUrl } = this.state;
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
                            {
                                currentUser.id && isSuperUser(currentUser.level) &&
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    filters={filtersChecked()}
                                />
                            }
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={filtersGeo(
                                    provinces || [],
                                    zones || [],
                                    areas || [],
                                    this.props,
                                    baseUrl,
                                )}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    imageTableUrl && videoTableUrl &&
                    <Fragment>
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
                            <div className={`widget__container no-border ${currentTab !== 'images' ? 'hidden' : ''}`} >
                                <CustomTableComponent
                                    showPagination
                                    endPointUrl={imageTableUrl}
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
                                    endPointUrl={videoTableUrl}
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
                    </Fragment>
                }
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
    loadProvinces: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    geoFilters: PropTypes.object.isRequired,
    currentUser: PropTypes.object.isRequired,
};

const QualityDashboardIntl = injectIntl(QualityDashboard);

const MapStateToProps = state => ({
    load: state.load,
    testsMapping: state.dashboard.testsMapping,
    reduxImagePage: state.dashboard.reduxImagePage,
    reduxVideoPage: state.dashboard.reduxVideoPage,
    profiles: state.dashboard.profiles,
    geoFilters: state.geoFilters,
    currentUser: state.currentUser.user,
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
    loadProvinces: provinces => dispatch(filterActions.loadProvinces(provinces)),
    selectProvince: (provinceId, zoneId, areaId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, null, false, false)),
    selectZone: (zoneId, areaId) => dispatch(filterActions.selectZone(zoneId, dispatch, false, areaId, null, false)),
    selectArea: (areaId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, false, zoneId, null, false)),

});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDashboardIntl);
