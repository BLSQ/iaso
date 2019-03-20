import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { dashboardActions } from '../redux/dashboard';
import TabsComponent from '../../../components/TabsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import qualityColumns from '../constants/qualityColumns';

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
        };
    }

    componentDidMount() {
        this.props.fetchTestMapping();
    }

    getEndpointUrl(type, toExport = false, exportType = 'csv') {
        let url = '/api/qctests/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            from: params.date_from,
            to: params.date_to,
            page: type === 'image' ? params.imagePage : params.videoPage,
            order: type === 'image' ? params.imageOrder : params.videoOrder,
            media_type: type,
            limit: type === 'image' ? params.imagePageSize : params.videoPageSize,
        };

        if (toExport) {
            urlParams[exportType] = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
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
        } = this.props;
        const { currentTab } = this.state;
        return (
            <section>
                {
                    loading &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <div className="widget__container">
                    <section>
                        <div className="widget__header">
                            <h2 className="widget__heading">
                                <PeriodSelectorComponent
                                    dateFrom={this.props.params.date_from}
                                    dateTo={this.props.params.date_to}
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
                        />
                    </div>
                </div>
            </section>
        );
    }
}

QualityDashboard.defaultProps = {
};

QualityDashboard.propTypes = {
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchTestMapping: PropTypes.func.isRequired,
};

const QualityDashboardIntl = injectIntl(QualityDashboard);

const MapStateToProps = state => ({
    load: state.load,
    testsMapping: state.dashboard.testsMapping,
});

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTestMapping: () => dispatch(dashboardActions.fetchTestMapping(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDashboardIntl);
