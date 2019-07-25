import React from 'react';
import { injectIntl, FormattedDate } from 'react-intl';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { currentUserActions } from '../../../redux/currentUserReducer';
import CustomTableComponent from '../../../components/CustomTableComponent';
import ImgModal from '../../../components/ImgModal';

const detailsColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'monitoring.label.createdAt',
            }),
            className: 'small',
            accessor: 'created_at',
            Cell: settings => (<FormattedDate value={new Date(settings.original.created_at)} />),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Réponse terrain',
                id: 'monitoring.label.fieldAnswer',
            }),
            accessor: 'result',
            className: 'small',
            Cell: settings => <span><strong>{ settings.original.result }</strong> <br />({ settings.original.tester })</span>,

        },
        {
            Header: formatMessage({
                defaultMessage: 'Réponse coordination',
                id: 'monitoring.label.coordinationAnswer',
            }),
            accessor: 'check_20_result',
            className: 'small',
            Cell: settings => <span><strong>{ settings.original.check_20_result } </strong> <br /> <span>{`${settings.original.check_20_validator ?  settings.original.check_20_validator : '--' }` } </span></span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Réponse central',
                id: 'monitoring.label.centralAnswer',
            }),
            accessor: 'check_30_result',
            className: 'small',
            Cell: settings => <span><strong>{ settings.original.check_30_result } </strong> <br /> <span>{`${settings.original.check_30_validator ?  settings.original.check_30_validator : '--' }` } </span></span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Media',
                id: 'monitoring.label.media',
            }),
            className: 'small',
            accessor: 'media_url',
            Cell: (settings) => {
                if (settings.original.media_type === 'image') {
                    return (
                        <div style={{ 'max-width': '100px', 'max-height': '100px' }}>
                            <ImgModal
                                imgPath={settings.original.media_url}
                                smallPreview
                                altText={formatMessage({
                                    defaultMessage: 'Résultat test dépistage',
                                    id: 'main.screening.result',
                                })}
                            />
                        </div>);
                }
                return <a href={settings.original.media_url} onClick={() => window.open(settings.original.media_url)}>Voir la vidéo</a>;
            },
        },
    ]
);

class QualityDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userLevel: null,
        };
    }

    componentDidMount() {
        // this.props.fetchTestDetail(this.props.params.test_id);
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

    render() {
        const {
            load: { loading, error },
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
                                onClick={() => window.history.back()}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>
                            {
                                <span>Détails des contrôles de qualité</span>
                            }
                        </h2>
                    </div>

                </section>
                <CustomTableComponent
                    showPagination={false}
                    endPointUrl={'/api/qcdetails/'+ userId + '/?from=' + params.date_from + '&to=' + params.date_to}
                    columns={detailsColumns(this.props.intl.formatMessage)}
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
    location: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
};

const QualityDetailIntl = injectIntl(QualityDetail);

const MapStateToProps = state => ({
    load: state.load,
    currentUser: state.currentUser.user,
    // tester: state.tester //the tester we are trying to view data from
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityDetailIntl);
