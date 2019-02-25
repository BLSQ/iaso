/* globals STATIC_URL */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import { currentUserActions } from '../../../redux/currentUserReducer';
import { userHasPermission } from '../../../utils/index';
import { loadActions } from '../../../redux/load';
import { homeActions } from '../redux/home';
import HomeMap from '../components/HomeMap';

class Home extends Component {
    componentWillMount() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        this.props.fetchCurrentUserInfos();
        this.props.fetchGeoZones();
    }

    componentWillReceiveProps(newProps) {
        const { currentUser, dispatch } = newProps;
        if ((currentUser.isConnected !== this.props.currentUser.isConnected) &&
            (currentUser.isConnected === false ||
                (currentUser.isConnected === true && currentUser.user !== {}))) {
            dispatch(loadActions.successLoadingNoData());
        }
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            currentUser,
            geoZones,
            zones,
        } = this.props;
        return (
            <section className="home-container">
                {
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                {
                    currentUser.isConnected === false &&
                    <a href="/login" className="button home-login-button">
                        <FormattedMessage id="home.connect" defaultMessage="Se connecter" />
                    </a>
                }

                <section className="section--feature--welcome">
                    <div className="section__content">
                        <div className="section__content--welcome">
                            <h1>
                                <FormattedMessage id="home.title" defaultMessage="Bienvenue au tableau de bord de Trypelim" />
                            </h1>
                            <div className="welcome__images">
                                <img src={`${STATIC_URL}images/drc-flag.png`} alt="DRC flag" />
                                <img src={`${STATIC_URL}images/pnltha-logo.png`} alt="PNLTHA logo" />
                            </div>
                            <p>
                                <FormattedMessage id="home.titleText" defaultMessage="Republique Democratique du Congo, Ministere de la Santé Publique, Programme National de Lutte contre la THA (PNLTHA)." />
                            </p>
                        </div>
                    </div>
                </section>
                <section className="section--feature--pilot-area">
                    <div className="section__content--pilot-area">
                        <h2><FormattedMessage id="home.subTitle" defaultMessage="Mission du Programme" /></h2>
                        <p><FormattedMessage id="home.text" defaultMessage="Coordonner et Organiser la lutte contre la THA en R.D.Congo" /></p>
                        <h2><FormattedMessage id="home.subTitle2" defaultMessage="Objectif du Programme" /></h2>
                        <p><FormattedMessage id="home.text2" defaultMessage="Réduire la morbidité et la mortalité due au THA à un niveau compatible avec une vie productive normale pour les habitants des zones où la maladie est endémique (1 cas par 10000 habitants)" /></p>
                        <h2><FormattedMessage id="home.subTitle3" defaultMessage="Organisation du Programme" /></h2>
                        <p>
                            <strong><FormattedMessage id="home.text3Strong" defaultMessage="Niveau Central" />: </strong>
                            <FormattedMessage id="home.text3" defaultMessage="Normatif et élaborer des stratégies et appui technique au niveau provincial" />:
                        </p>
                        <p>
                            <strong><FormattedMessage id="home.text4Strong" defaultMessage="Niveau Provincial" />: </strong>
                            <FormattedMessage id="home.text4" defaultMessage="Organiser et Coordonner la lutte dans la province. Fournir un appui technique de base et des conseils aux médecins provinciaux" />:
                        </p>
                        <p>
                            <strong><FormattedMessage id="home.text5Strong" defaultMessage="Niveau Périphérique Opérationnel" />: </strong>
                            <FormattedMessage id="home.text5" defaultMessage="Exécution de la lutte" />
                        </p>
                        {
                            userHasPermission('x_plannings_microplanning', currentUser) &&
                            <a href="/dashboard/plannings/micro/" className="button--success">
                                <FormattedMessage id="home.microplanningLink" defaultMessage="Utiliser l'outil de reprogrammation" />
                                <i className="fa fa-arrow-right icon--right" />
                            </a>
                        }
                    </div>
                    <div className="section__content__image--pilot-area" id="home-map">
                        {
                            geoZones &&
                            <HomeMap
                                overlays={{ labels: false }}
                                geoZones={geoZones}
                                zones={zones}
                            />
                        }
                        {
                            !geoZones &&
                            <div className="loading-small">
                                <i className="fa fa-spinner" />
                            </div>
                        }
                    </div>
                </section>
                <section className="section--feature--reports">
                    <div className="section__content__image--reports">
                        <img src={`${STATIC_URL}images/monthly-report.png`} alt="Monthly report example" />
                    </div>
                    <div className="section__content--reports">
                        <h2>
                            <FormattedMessage id="home.subTitle4" defaultMessage="Voir les rapports de campagne mensuels" />
                        </h2>
                        <p>
                            <FormattedMessage id="home.text6" defaultMessage="Rapport montrant les statistiques mensuel et annuel sur les dépistages actifs et passifs de la THA, les statistiques comprenent le nombre de cas suspects confirmé, la PTR, la PTE et plus encore." />
                        </p>
                        {
                            userHasPermission('x_stats_reports', currentUser) &&
                            <a href="/dashboard/monthly-report/" className="button--bright">
                                <FormattedMessage id="home.monthlyReportLink" defaultMessage="Rapports mensuels" />
                                <i className="fa fa-arrow-right icon--right" />
                            </a>
                        }
                    </div>
                </section>
                <section className="section--feature--suspect">
                    <div className="section__content--suspect">
                        <h2>
                            <FormattedMessage id="home.subTitle5" defaultMessage="Suivi des cas non confirmés" />
                        </h2>
                        <p>
                            <FormattedMessage id="home.text6" defaultMessage="Télécharger une liste des suspects non examinés, des examinés non confirmés, des confirmés non traités." />
                        </p>
                        {
                            userHasPermission('x_case_cases', currentUser) &&
                            <a href="/dashboard/datas/tests?suspect=true" className="button--bright">
                                <FormattedMessage id="home.casesLink" defaultMessage="Aller sur les cas THA" />
                                <i className="fa fa-arrow-right icon--right" />
                            </a>
                        }
                    </div>
                </section>
                <section className="section--feature--partners">
                    <h2>
                        <FormattedMessage id="home.subTitle6" defaultMessage="En partenariat avec" />
                    </h2>
                    <div className="section__content--partners">
                        <div className="section__list--partners">
                            <a href="https://www.itg.be/" target="_blank" rel="noopener noreferrer">
                                <img src={`${STATIC_URL}images/itg_logo.png`} alt="ITG logo" />
                            </a>
                        </div>
                    </div>
                </section>
            </section>
        );
    }
}
Home.defaultProps = {
    geoZones: null,
};

Home.propTypes = {
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    fetchGeoZones: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    geoZones: PropTypes.object,
    zones: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    currentUser: state.currentUser,
    geoZones: state.home.geoZones,
    zones: state.home.zones,
    isAreasloading: state.home.isAreasloading,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch, true)),
    fetchGeoZones: () => dispatch(homeActions.fetchGeoZones(dispatch)),
});

const HomeWithIntl = injectIntl(Home);

export default connect(MapStateToProps, MapDispatchToProps)(HomeWithIntl);
