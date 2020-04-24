import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import { geoActions } from '../../../redux/geoRedux';
import filtersGeo from '../constants/geoFilters';
import VillageInfosComponent from './VillageInfosComponent';
import LocationMapComponent from '../../../components/LocationMapComponent';
import TabsComponent from '../../../components/TabsComponent';
import { villageActions } from '../redux/villages';

const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Informations',
        id: 'main.label.informations',
    },
    localisation: {
        defaultMessage: 'Localisation',
        id: 'main.label.location',
    },
});
let timerSuccess;
let timerError;

class VillageModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            isChanged: false,
            isUpdated: false,
            error: false,
            currentTab: 'infos',
        };
    }

    componentWillMount() {
        const {
            loadProvinces,
            provinces,
        } = this.props;
        loadProvinces(provinces);
        ReactModal.setAppElement('.container--main');
        if (this.props.village.AS__ZS__province_id) {
            this.props.selectProvince(this.props.village.AS__ZS__province_id, this.props.village.AS__ZS_id, this.props.village.AS_id);
        } else if (this.props.village.AS__ZS_id) {
            this.props.selectZone(this.props.village.AS__ZS_id, this.props.village.AS_id);
        } else if (this.props.village.AS_id) {
            this.props.selectArea(this.props.village.AS_id, this.props.village.AS__ZS_id);
        }
    }

    componentWillReceiveProps(nextProps) {
        let newState = {};
        if (!deepEqual(nextProps.village, this.props.village, true) && !nextProps.isUpdated) {
            newState.isChanged = true;
        }
        if (nextProps.isUpdated) {
            newState.isChanged = false;
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
        this.setState(newState);
    }

    componentDidUpdate(prevProps) {
        const {
            village,
        } = this.props;
        if (prevProps.village.AS__ZS__province_id !== village.AS__ZS__province_id) {
            this.props.selectProvince(village.AS__ZS__province_id, village.AS__ZS_id, village.AS_id);
        } else if (prevProps.village.AS__ZS_id !== village.AS__ZS_id) {
            this.props.selectZone(village.AS__ZS_id, village.AS_id);
        } else if (prevProps.village.AS_id !== village.AS_id) {
            this.props.selectArea(village.AS_id, village.AS__ZS_id);
        }
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


    isSavedDisabled() {
        const {
            village,
        } = this.props;
        const {
            isChanged,
        } = this.state;
        return (village.name === ''
            || !village.name
            || !village.AS__ZS__province_id
            || !village.AS__ZS_id
            || !village.AS_id
            || !village.village_official
            || !village.latitude
            || !village.longitude
            || village.latitude === 0
            || village.longitude === 0
            || (!isChanged && village.id !== 0));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            geoFiltersModale: {
                provinces,
                zones,
                areas,
            },
            villageSources,
            params,
            village,
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
                onRequestClose={() => this.props.closeModal()}
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
                        this.state.currentTab === 'infos'
                        && (
                            <VillageInfosComponent
                                village={village}
                                updateVillageField={(key, value) => this.props.updateCurrentVillage({
                                    ...village,
                                    [key]: value,
                                })}
                                villageSources={villageSources}
                            />
                        )
                    }
                    <section className={this.state.currentTab !== 'localisation' ? 'hidden-opacity' : ''}>
                        <LocationMapComponent
                            updateCurrentVillage={newVillage => this.props.updateCurrentVillage(newVillage)}
                            filters={geo}
                            params={params}
                            baseUrl="management/villages"
                        />
                    </section>
                    {
                        this.state.isUpdated
                        && (
                            <div className="align-right text--success">
                                <FormattedMessage id="main.label.villageUpdated" defaultMessage="Village saved" />
                            </div>
                        )
                    }
                    {
                        this.state.error
                        && (
                            <div className="align-right text--error">
                                <FormattedMessage id="main.label.error" defaultMessage="Une erreur est survenue lors de la sauvegarde" />
                            </div>
                        )
                    }
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.closeModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        <button
                            disabled={this.isSavedDisabled()}
                            className="button--save"
                            onClick={() => this.props.saveVillage(village)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="management.label.saveVillage" defaultMessage="Save village" />
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
    closeModal: PropTypes.func.isRequired,
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
    villageSources: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
    loadProvinces: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    geoFiltersModale: state.geoFiltersModale,
    provinces: state.geoFilters.provinces,
    village: state.villages.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    loadProvinces: provinces => dispatch(geoActions.loadProvinces(provinces)),
    selectProvince: (provinceId, zoneId, areaId) => dispatch(geoActions.selectProvince(provinceId, dispatch, zoneId, areaId, null, false)),
    selectZone: (zoneId, areaId) => dispatch(geoActions.selectZone(zoneId, dispatch, false, areaId)),
    selectArea: (areaId, zoneId) => dispatch(geoActions.selectArea(areaId, dispatch, false, zoneId)),
    updateCurrentVillage: village => dispatch(villageActions.updateCurrentVillage(village)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(VillageModale));
