import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import { filterActions } from '../../../redux/filtersRedux';
import filtersGeo from '../constants/geoFilters';
import VillageInfosComponent from './VillageInfosComponent';
import VillageMapComponent from './VillageMapComponent';
import TabsComponent from '../../../components/TabsComponent';

const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Informations',
        id: 'management.infos',
    },
    localisation: {
        defaultMessage: 'Localisation',
        id: 'management.localisation',
    },
});
let timerSuccess;
let timerError;

class VillageModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            village: props.village,
            isChanged: false,
            isUpdated: false,
            error: false,
            currentTab: 'infos',
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
        if (this.props.village.province_id) {
            this.props.selectProvince(this.props.village.province_id, this.props.village.ZS_id, this.props.village.AS_id);
        } else if (this.props.village.ZS_id) {
            this.props.selectZone(this.props.village.ZS_id, this.props.village.AS_id);
        } else if (this.props.village.AS_id) {
            this.props.selectArea(this.props.village.AS_id, this.props.village.ZS_id);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.village.province_id !== this.props.village.province_id) {
            this.props.selectProvince(nextProps.village.province_id, nextProps.village.ZS_id, nextProps.village.AS_id);
        } else if (nextProps.village.ZS_id !== this.props.village.ZS_id) {
            this.props.selectZone(nextProps.village.ZS_id, nextProps.village.AS_id);
        } else if (nextProps.village.AS_id !== this.props.village.AS_id) {
            this.props.selectArea(nextProps.village.AS_id, nextProps.village.ZS_id);
        }
        let newState = {};
        newState.village = nextProps.village;
        if (nextProps.isUpdated) {
            newState.isUpdated = nextProps.isUpdated;
            newState.error = false;
            timerSuccess = setTimeout(() => {
                this.setState({
                    isUpdated: false,
                });
            }, 10000);
        }
        if (nextProps.error) {
            newState = {
                error: nextProps.error,
                isUpdated: false,
                isChanged: true,
            };
            timerError = setTimeout(() => {
                this.setState({
                    error: false,
                });
            }, 10000);
        }
        if (!deepEqual(nextProps.village, this.props.village, true)) {
            newState.village = nextProps.village;
        }
        this.setState(newState);
    }

    componentWillUnmount() {
        this.props.selectProvince(null);
        if (timerSuccess) {
            clearTimeout(timerSuccess);
        }
        if (timerError) {
            clearTimeout(timerError);
        }
    }


    updateVillageField(key, value) {
        const newVillage = Object.assign({}, this.state.village, { [key]: value });
        if (key === 'province_id') {
            newVillage.ZS_id = null;
            newVillage.AS_id = null;
        }
        if (key === 'ZS_id') {
            newVillage.AS_id = null;
        }
        this.props.updateCurrentVillage(newVillage);
        this.setState({
            isChanged: true,
        });
    }

    updateVillagePosition(latitude, longitude) {
        const newVillage = Object.assign({}, this.state.village, { latitude, longitude });
        this.props.updateCurrentVillage(newVillage);
        this.setState({
            isChanged: true,
        });
    }

    isSavedDisabled() {
        return (this.state.village.name === '' ||
            !this.state.village.name ||
            !this.state.village.province_id ||
            !this.state.village.ZS_id ||
            !this.state.village.AS_id ||
            !this.state.village.village_official ||
            this.state.village.latitude === 0 ||
            this.state.village.longitude === 0 ||
            (!this.state.isChanged && this.state.village.id !== 0));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            geoFiltersModale: {
                provinces,
                zones,
                areas,
            },
            params,
        } = this.props;
        const geo = filtersGeo(
            provinces,
            zones,
            areas,
            this,
        );
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModale()}
            >
                <section className="edit-modal large extra">
                    <TabsComponent
                        selectTab={key => (this.setState({ currentTab: key }))}
                        isRedirecting={false}
                        currentTab={this.state.currentTab}
                        tabs={[
                            { label: formatMessage(MESSAGES.infos), key: 'infos' },
                            { label: formatMessage(MESSAGES.localisation), key: 'localisation' },
                        ]}
                        defaultSelect={this.state.currentTab}
                    />

                    {
                        this.state.currentTab === 'infos' &&
                        <VillageInfosComponent
                            village={this.state.village}
                            updateVillageField={(key, value) => this.updateVillageField(key, value)}
                        />
                    }
                    <section className={this.state.currentTab !== 'localisation' ? 'hidden-opacity' : ''} >
                        <VillageMapComponent
                            village={this.state.village}
                            updateVillageField={(key, value) => this.updateVillageField(key, value)}
                            filters={geo}
                            params={params}
                            updateVillagePosition={(lat, lng) => this.updateVillagePosition(lat, lng)}
                        />
                    </section>
                    {
                        this.state.isUpdated &&
                        <div className="align-right text--success">
                            <FormattedMessage id="main.label.villageUpdated" defaultMessage="Village sauvegardé" />
                        </div>
                    }
                    {
                        this.state.error &&
                        <div className="align-right text--error">
                            <FormattedMessage id="main.label.erro" defaultMessage="Une erreur est survenue lors de la sauvegarde" />
                        </div>
                    }
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.closeModale()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        <button
                            disabled={this.isSavedDisabled()}
                            className="button--save"
                            onClick={() => this.props.saveVillage(this.state.village)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveVillage" defaultMessage="Sauvegarder la village" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
VillageModale.defaultProps = {
    village: null,
    error: null,
};
VillageModale.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    closeModale: PropTypes.func.isRequired,
    village: PropTypes.object,
    saveVillage: PropTypes.func.isRequired,
    updateCurrentVillage: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    error: PropTypes.any,
    geoFiltersModale: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    geoFiltersModale: state.geoFiltersModale,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    selectProvince: (provinceId, zoneId, areaId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, null, false)),
    selectZone: (zoneId, areaId) => dispatch(filterActions.selectZone(zoneId, dispatch, false, areaId)),
    selectArea: (areaId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, false, zoneId)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(VillageModale));
