import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import patientInfosMessages from '../constants/patientInfosMessages';


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
        const infoList = patientInfosMessages(formatMessage);
        return (
            <div className="patient-infos-container no-padding-right">
                <table>
                    <tbody>
                        {
                            Object.keys(infoList).map((key) => {
                                let className;
                                const hasConflict = conflicts.find(c => c.key === key && !c.value);
                                if (!isResult) {
                                    const solvedConflict = conflicts.find(c => c.key === key && c.value);
                                    className = `${hasConflict ? 'error' : ''} ${hasConflict && patient[key] ? 'pointer' : ''} ${hasConflict && !patient[key] ? 'forbid-pointer' : ''}`;
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
                                            {formatMessage(infoList[key])}
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
                                                key === 'death_date' &&
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
                                                key === 'death' &&
                                                (
                                                    patient.death.dead === false && fieldPlaceholder !== '--' ? '--' : ''
                                                )
                                            }
                                            {
                                                key === 'year_of_birth' &&
                                                (
                                                    patient.year_of_birth ?
                                                        <span>
                                                            {`${patient.year_of_birth} (${moment().format('YYYY') - patient.year_of_birth} ${
                                                                formatMessage({
                                                                    defaultMessage: 'ans',
                                                                    id: 'patientsinfos.years',
                                                                })})`}
                                                        </span>
                                                        : fieldPlaceholder
                                                )
                                            }
                                            {
                                                ((key !== 'sex' && key !== 'death_date' && key !== 'year_of_birth')) &&
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
