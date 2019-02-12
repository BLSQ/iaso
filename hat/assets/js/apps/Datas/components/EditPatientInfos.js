import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css';

import patientInfosMessages from '../constants/patientInfosMessages';


class EditPatientInfos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: props.patient,
            isModified: false,
        };
    }

    componentWillReceiveProps(newProps) {
        const newState = {
            ...this.state,
            patient: newProps.patient,
        };
        if (newProps.isUpdated) {
            newState.isModified = false;
        }
        this.setState(newState);
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

    resetPatient() {
        this.setState({
            patient: this.props.patient,
            isModified: false,
        });
    }

    render() {
        const {
            patient,
            isModified,
        } = this.state;
        const {
            intl: {
                formatMessage,
            },
            savePatient,
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
                                                    currentField.type === 'text' &&
                                                    <input
                                                        type="text"
                                                        name={key}
                                                        id={key}
                                                        value={patient[key]}
                                                        onChange={event => this.updatePatientField(key, event.currentTarget.value)}
                                                    />
                                                }
                                                {
                                                    currentField.type === 'select' &&
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
                                                }
                                                {
                                                    currentField.type === 'int' &&
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
                                                }
                                                {
                                                    currentField.type === 'date' &&
                                                    <DatePicker
                                                        dateFormat="DD-MM-YYYY"
                                                        dateFormatCalendar="YYYY-MM-DD"
                                                        selected={patient[key] ? moment(patient[key]) : null}
                                                        onChange={date => this.updatePatientField(key, date)}
                                                        maxDate={moment()}
                                                        placeholderText="--"
                                                    />
                                                }
                                                {
                                                    currentField.key === 'year_of_birth' &&
                                                    <span>
                                                        {
                                                            moment().format('YYYY') - patient.year_of_birth
                                                        }
                                                    </span>
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
                        this.props.isUpdated &&
                        <div className="align-right text--success margin-bottom">
                            <FormattedMessage id="main.label.patientUpdated" defaultMessage="Patient sauvegardé" />
                        </div>
                    }
                    {
                        this.props.hasError &&
                        <div className="align-right text--error margin-bottom">
                            <FormattedMessage id="main.label.patientUpdateError" defaultMessage="Une erreur est survenue lors de la sauvegarde" />
                        </div>
                    }
                    <button
                        className="button margin-right"
                        disabled={!isModified}
                        onClick={() => this.resetPatient()}
                    >
                        <FormattedMessage
                            id="patientInfos.cancel"
                            defaultMessage="Annuler"
                        />
                    </button>
                    <button
                        className="button"
                        disabled={!isModified}
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

EditPatientInfos.defaultProps = {
};

EditPatientInfos.propTypes = {
    patient: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    savePatient: PropTypes.func.isRequired,
    hasError: PropTypes.bool.isRequired,
    isUpdated: PropTypes.bool.isRequired,
};

const EditPatientInfosWithIntl = injectIntl(EditPatientInfos);

export default EditPatientInfosWithIntl;
