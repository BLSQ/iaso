import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

const MESSAGES = {
    last_name: {
        defaultMessage: 'Nom',
        id: 'patientsinfos.last_name',
    },
    post_name: {
        defaultMessage: 'Postnom',
        id: 'patientsinfos.post_name',
    },
    first_name: {
        defaultMessage: 'Prénom',
        id: 'patientsinfos.first_name',
    },
    mothers_surname: {
        defaultMessage: 'Nom de la mère',
        id: 'patientsinfos.mothers_surname',
    },
    sex: {
        defaultMessage: 'Sexe',
        id: 'patientsinfos.sex',
    },
    death: {
        defaultMessage: 'Décès',
        id: 'patientsinfos.death',
    },
    age: {
        defaultMessage: 'Age',
        id: 'patientsinfos.age',
    },
    province: {
        defaultMessage: 'Province d\'origine',
        id: 'patientsinfos.province',
    },
    ZS: {
        defaultMessage: 'Zone d\'origine',
        id: 'patientsinfos.ZS',
    },
    AS: {
        defaultMessage: 'Aire d\'origine',
        id: 'patientsinfos.AS',
    },
    village: {
        defaultMessage: 'Village d\'origine',
        id: 'patientsinfos.village',
    },
};

class PatientInfos extends React.Component {
    render() {
        const {
            patient,
            fixConflict,
            conflicts,
            isResult,
        } = this.props;
        const { formatMessage } = this.props.intl;
        const fieldPlaceholder = isResult ? '' : '--';
        return (
            <div className="patient-infos-container no-padding-right">
                <table>
                    <tbody>
                        {
                            Object.keys(MESSAGES).map((key) => {
                                let className;
                                const hasConflict = conflicts.find(c => c.key === key && !c.value);
                                if (!isResult) {
                                    const solvedConflict = conflicts.find(c => c.key === key && c.value);
                                    className = `${hasConflict ? 'error' : ''}`;
                                    if (key === 'death') {
                                        className += patient.death.dead ? ' error-text' : '';
                                    }
                                    if (solvedConflict) {
                                        className += ` solved ${patient[key] === solvedConflict.value ? 'active' : ''}`;
                                    }
                                } else {
                                    className = `${hasConflict ? 'warning-light' : ''}`;
                                }
                                return (
                                    <tr
                                        key={key}
                                        onClick={() => fixConflict(key, patient[key])}
                                    >
                                        <th>
                                            {formatMessage(MESSAGES[key])}
                                        </th>
                                        <td className={className}>
                                            {
                                                key === 'sex' &&
                                                <span>
                                                    {
                                                        patient.sex === 'female' &&
                                                        <span>
                                                            <i className="fa fa-female" /> {' - '}
                                                            {
                                                                formatMessage({
                                                                    defaultMessage: 'Femme',
                                                                    id: 'main.label.female',
                                                                })
                                                            }
                                                        </span>
                                                    }
                                                    {
                                                        patient.sex === 'male' &&
                                                        <span>
                                                            <i className="fa fa-male" /> {' - '}
                                                            {
                                                                formatMessage({
                                                                    defaultMessage: 'Homme',
                                                                    id: 'main.label.male',
                                                                })
                                                            }
                                                        </span>
                                                    }
                                                    {
                                                        patient.sex !== 'male' && patient.sex !== 'female' &&
                                                        fieldPlaceholder
                                                    }
                                                </span>
                                            }
                                            {
                                                key === 'death' &&
                                                (
                                                    patient.death.dead ?
                                                        <span>
                                                            <FormattedMessage id="patientsinfos.deathThe" defaultMessage="Décès le" />
                                                            {`  ${moment(patient.death.death_date).format('DD-MM-YYYY')}`}
                                                        </span>
                                                        : fieldPlaceholder
                                                )
                                            }
                                            {
                                                ((key !== 'sex' && key !== 'death')) &&
                                                    (
                                                        patient[key] ? patient[key] : fieldPlaceholder
                                                    )
                                            }
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}

PatientInfos.defaultProps = {
    fixConflict: () => { },
    conflicts: [],
    isResult: false,
};

PatientInfos.propTypes = {
    patient: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fixConflict: PropTypes.func,
    conflicts: PropTypes.array,
    isResult: PropTypes.bool,
};

const PatientInfosWithIntl = injectIntl(PatientInfos);

export default PatientInfosWithIntl;
