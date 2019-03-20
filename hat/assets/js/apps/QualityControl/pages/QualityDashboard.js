import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import { createUrl, getRequest } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { dashboardActions } from '../redux/dashboard';
import TabsComponent from '../../../components/TabsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import imagesColumns from '../constants/imagesColumns';

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
            imagesColumns: imagesColumns(props.intl.formatMessage),
        };
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

    updateDashboardInfos(from = this.props.params.date_from, to = this.props.params.date_to) {
        const url = `/api/qcstats?from=${from}&to=${to}`;
        this.props.getDashboardInfos(url);
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
                        </section>
                    }
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
                {
                    this.props.infos &&
                    <div className="widget__container">
                        <div className={`widget__container no-border ${this.state.currentTab !== 'images' ? 'hidden' : ''}`} >
                            <CustomTableComponent
                                showPagination
                                endPointUrl={this.getEndpointUrl('image')}
                                columns={this.state.imagesColumns}
                                defaultSorted={[{ id: 'date', desc: false }]}
                                params={params}
                                defaultPath={baseUrl}
                                orderKey="imageOrder"
                                multiSort
                                withBorder={false}
                                isSortable
                                dataKey="list"
                                onRowClicked={() => { }}
                                pageKey="imagePage"
                                pageSizeKey="imagePageSize"
                            />
                        </div>
                    </div>
                }
            </section>
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
