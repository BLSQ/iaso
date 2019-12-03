import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import moment from 'moment';
import DatePicker from 'react-datepicker';

import patientInfosMessages from '../constants/patientInfosMessages';
import FiltersComponent from '../../../components/FiltersComponent';
import { getAgeFromYear } from '../../../utils/index';

import {
    filtersProvinces,
    filtersZones,
    filtersAreas,
    filtersVillage,
} from '../constants/geoFilters';

const MESSAGES = {
    years: {
        defaultMessage: 'ans',
        id: 'main.label.yearsOld',
    },
};

class EditPatientInfos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: props.patient,
            isModified: false,
            baseUrl: props.params.case_id ? 'tests/detail' : 'register/detail',
        };
    }

    componentWillReceiveProps(newProps) {
        const patient = {
            ...newProps.patient,
            province_id: newProps.params.prov_id,
            ZS_id: newProps.params.ZS_id,
            AS_id: newProps.params.AS_id,
            village_id: newProps.params.vil_id,
        };

        const newState = {
            ...this.state,
            patient,
        };

        if (newProps.isUpdated) {
            newState.isModified = false;
        } else if ((newProps.params.prov_id !== this.props.params.prov_id)
            || (newProps.params.ZS_id !== this.props.params.ZS_id)
            || (newProps.params.AS_id !== this.props.params.AS_id)
            || (newProps.params.vil_id !== this.props.params.vil_id)) {
            newState.isModified = true;
        }
        this.setState(newState);
    }

    updatePatientGeoField(key, value) {
        const { params, redirectTo, baseUrl } = this.props;
        const newParams = {
            ...params,
        };
        newParams[key] = value;
        if (key === 'prov_id') {
            delete newParams.ZS_id;
            delete newParams.AS_id;
            delete newParams.vil_id;
        }
        if (key === 'ZS_id') {
            delete newParams.AS_id;
            delete newParams.vil_id;
        }
        if (key === 'AS_id') {
            delete newParams.vil_id;
        }
        redirectTo(baseUrl, newParams);
    }

    updatePatientField(key, value) {
        const patient = {
            ...this.state.patient,
        };
        patient[key] = value;
        if (key === 'death_date') {
            if (moment(value).isValid()) {
                patient.death = {
                    dead: true,
                    death_date: moment(value).format('YYYY-MM-DD'),
                };
            } else {
                patient.death = {
                    dead: false,
                };
            }
        }
        this.setState({
            patient,
            isModified: true,
        });
    }

    render() {
        const {
            patient,
            isModified,
            baseUrl,
        } = this.state;
        const {
            intl: {
                formatMessage,
            },
            savePatient,
            params,
            geoFilters: {
                provinces,
                zones,
                areas,
                villages,
            },
            closeEdit,
        } = this.props;
        const infoList = patientInfosMessages(formatMessage);
        return (
            <div className="patient-infos-container no-padding-right">
                <table>
                    <tbody>
                        {
                            Object.keys(infoList).map((key) => {
                                const currentField = infoList[key];
                                return (
                                    <tr
                                        key={key}
                                    >
                                        <th>
                                            {formatMessage(currentField)}
                                        </th>
                                        <td>
                                            <div>
                                                {
                                                    currentField.type === 'text'
                                                    && (
                                                        <input
                                                            type="text"
                                                            name={key}
                                                            id={key}
                                                            value={patient[key]}
                                                            onChange={event => this.updatePatientField(key, event.currentTarget.value)}
                                                        />
                                                    )
                                                }
                                                {
                                                    currentField.type === 'select'
                                                    && (
                                                        <Select
                                                            multi={false}
                                                            clearable={false}
                                                            simpleValue
                                                            name={key}
                                                            value={patient[key]}
                                                            placeholder="--"
                                                            options={currentField.options}
                                                            onChange={value => this.updatePatientField(key, value)}
                                                        />
                                                    )
                                                }
                                                {
                                                    currentField.type === 'int'
                                                    && (
                                                        <input
                                                            type="number"
                                                            min={currentField.min}
                                                            max={moment().format('YYYY')}
                                                            name={key}
                                                            id={key}
                                                            placeholder="- - - -"
                                                            value={patient[key] ? patient[key] : ''}
                                                            onChange={event => this.updatePatientField(key, event.currentTarget.value)}
                                                        />
                                                    )
                                                }
                                                {
                                                    currentField.type === 'date'
                                                    && (
                                                        <DatePicker
                                                            dateFormat="DD-MM-YYYY"
                                                            dateFormatCalendar="YYYY-MM-DD"
                                                            selected={patient[key] ? moment(patient[key]) : null}
                                                            onChange={date => this.updatePatientField(key, date)}
                                                            maxDate={moment()}
                                                            placeholderText="--"
                                                        />
                                                    )
                                                }
                                                {
                                                    key === 'year_of_birth'
                                                    && (
                                                        <span className="years">
                                                            {
                                                                ` ${getAgeFromYear(patient.year_of_birth)} ${formatMessage(MESSAGES.years)}`
                                                            }
                                                        </span>
                                                    )
                                                }
                                                {
                                                    key === 'province'
                                                    && (
                                                        <FiltersComponent
                                                            params={params}
                                                            baseUrl={baseUrl}
                                                            filters={filtersProvinces(provinces, this)}
                                                        />
                                                    )
                                                }
                                                {
                                                    key === 'ZS'
                                                    && (
                                                        <FiltersComponent
                                                            params={params}
                                                            baseUrl={baseUrl}
                                                            filters={filtersZones(zones, this)}
                                                        />
                                                    )
                                                }
                                                {
                                                    key === 'AS'
                                                    && (
                                                        <FiltersComponent
                                                            params={params}
                                                            baseUrl={baseUrl}
                                                            filters={filtersAreas(areas, this)}
                                                        />
                                                    )
                                                }
                                                {
                                                    key === 'village'
                                                    && (
                                                        <FiltersComponent
                                                            params={params}
                                                            baseUrl={baseUrl}
                                                            filters={filtersVillage(villages, this)}
                                                        />
                                                    )
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
                <div className="align-right margin-top">
                    {
                        this.props.isUpdated
                        && (
                            <div className="align-right text--success margin-bottom">
                                <FormattedMessage id="main.label.patientUpdated" defaultMessage="Patient sauvegardé" />
                            </div>
                        )
                    }
                    {
                        this.props.hasError
                        && (
                            <div className="align-right text--error margin-bottom">
                                <FormattedMessage id="main.label.patientUpdateError" defaultMessage="Une erreur est survenue lors de la sauvegarde" />
                            </div>
                        )
                    }
                    <button
                        className="button margin-right"
                        onClick={() => closeEdit()}
                    >
                        <FormattedMessage
                            id="patientInfos.back"
                            defaultMessage="Retour"
                        />
                    </button>
                    <button
                        className="button"
                        disabled={!isModified || !params.prov_id || !params.ZS_id || !params.AS_id}
                        onClick={() => savePatient(this.state.patient)}
                    >
                        <FormattedMessage
                            id="patientInfos.save"
                            defaultMessage="Sauvegarder"
                        />
                    </button>
                </div>
            </div>
        );
    }
}

EditPatientInfos.propTypes = {
    patient: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    savePatient: PropTypes.func.isRequired,
    hasError: PropTypes.bool.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    geoFilters: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    baseUrl: PropTypes.string.isRequired,
    closeEdit: PropTypes.func.isRequired,
};

const EditPatientInfosWithIntl = injectIntl(EditPatientInfos);

export default EditPatientInfosWithIntl;
