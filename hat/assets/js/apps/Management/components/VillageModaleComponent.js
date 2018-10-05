import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import { filterActions } from '../../../redux/filtersRedux';
import FiltersComponent from '../../../components/FiltersComponent';
import filtersGeo from '../constants/geoFilters';


class VillageModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            village: props.village,
            isChanged: false,
            isUpdated: false,
            error: false,
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
        if (nextProps.isUpdated) {
            newState.isUpdated = nextProps.isUpdated;
            newState.error = false;
            setTimeout(() => {
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
            setTimeout(() => {
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

    isSavedDisabled() {
        return (this.state.village.name === '' ||
            !this.state.village.name ||
            !this.state.village.province_id ||
            !this.state.village.ZS_id ||
            !this.state.village.AS_id ||
            !this.state.village.population ||
            !this.state.village.village_official ||
            // !this.state.village.latitude ||
            // !this.state.village.longitude ||
            (!this.state.isChanged && this.state.village.id !== 0));
    }

    render() {
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
        const { formatMessage } = this.props.intl;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModale()}
            >
                <section className="edit-modal large">
                    <section>
                        <div className="align-right">
                            <label
                                htmlFor={`name-${this.state.village.id}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.name"
                                    defaultMessage="Nom"
                                />:
                            </label>
                            <input
                                type="text"
                                name="name"
                                id={`name-${this.state.village.id}`}
                                value={this.state.village.name}
                                onChange={event => this.updateVillageField('name', event.currentTarget.value)}
                            />
                        </div>
                        <div className="align-right">
                            <label
                                htmlFor={`name-${this.state.village.population}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.population"
                                    defaultMessage="population"
                                />:
                            </label>
                            <input
                                type="text"
                                name="name"
                                id={`name-${this.state.village.population}`}
                                value={this.state.village.population}
                                onChange={event => this.updateVillageField('population', parseInt(event.currentTarget.value, 10))}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor={`name-${this.state.village.village_official}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.village_official"
                                    defaultMessage="Officel"
                                />:
                            </label>
                            <Select
                                multi={false}
                                clearable
                                simpleValue
                                name="village_official"
                                value={this.state.village.village_official}
                                placeholder="--"
                                options={[
                                    {
                                        label: formatMessage({
                                            defaultMessage: 'Villages officiels',
                                            id: 'management.village_official.YES',
                                        }),
                                        value: 'YES',
                                    },
                                    {
                                        label: formatMessage({
                                            defaultMessage: 'Villages non officiels',
                                            id: 'management.village_official.NO',
                                        }),
                                        value: 'NO',
                                    },
                                    {
                                        label: formatMessage({
                                            defaultMessage: 'Villages trouvés lors de campagne',
                                            id: 'management.village_official.OTHER',
                                        }),
                                        value: 'OTHER',
                                    },
                                    {
                                        label: formatMessage({
                                            defaultMessage: 'Villages issus d\'images satellite',
                                            id: 'management.village_official.NA',
                                        }),
                                        value: 'NA',
                                    },
                                ]}
                                onChange={value => this.updateVillageField('village_official', value)}
                            />
                        </div>
                        <div className="filters-container">
                            <FiltersComponent
                                params={params}
                                baseUrl="management/villages"
                                filters={geo}
                            />
                        </div>
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
                            <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
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
