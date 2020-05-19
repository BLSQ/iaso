import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';
import { getTreatmentMessage } from '../utils';
import { getNullBolleanMessage } from '../../../components/NullBooleanRadio';

const TreatmentComponent = ({
    treatment, canEditPatientInfos, toggleModal, treatmentChoices,
}) => (
    <table>
        <thead className="custom-head">
            <tr>
                <th colSpan="2">
                    <strong>
                        <FormattedMessage
                            id="management.detail.treatment"
                            defaultMessage="Treatment"
                        />
                        <span className="inline-block margin-left--tiny--tiny"> ID:</span>
                        <span className="inline-block margin-left--tiny--tiny">{treatment.id}</span>
                    </strong>
                    {
                        canEditPatientInfos
                        && (
                            <span
                                tabIndex={0}
                                role="button"
                                className="edit-button"
                                onClick={() => toggleModal()}
                            >
                                <i className="fa fa-edit" />
                            </span>
                        )
                    }
                </th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.start_date" defaultMessage="Start date" />
                </th>
                <td>
                    {treatment.start_date ? moment(treatment.start_date).format('DD-MM-YYYY') : '--'}
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.complete" defaultMessage="Complete" />
                </th>
                <td>
                    <FormattedMessage {...getNullBolleanMessage(treatment.complete)} />
                </td>
            </tr>
            {
                treatment.complete === false
                && (
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.incomplete_reasons" defaultMessage="Incomplete reason" />
                        </th>
                        <td>
                            {
                                treatment.incomplete_reasons.length > 0
                            && (
                                <ul>
                                    {
                                        treatment.incomplete_reasons.map(r => (
                                            <li key={r}>
                                                {
                                                    getTreatmentMessage('incompleteReasonsChoices', r, treatmentChoices)
                                                }
                                            </li>
                                        ))
                                    }
                                </ul>
                            )
                            }
                            {
                                treatment.incomplete_reasons.length === 0 && '--'
                            }
                        </td>
                    </tr>
                )
            }
            {
                treatment.complete
                && (
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.end_date" defaultMessage="End date" />
                        </th>
                        <td>
                            {treatment.end_date ? moment(treatment.end_date).format('DD-MM-YYYY') : '--'}
                        </td>
                    </tr>
                )
            }
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.medicine" defaultMessage="Medicine" />
                </th>
                <td>
                    {
                        getTreatmentMessage('medChoices', treatment.medicine, treatmentChoices)
                    }
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.success" defaultMessage="Success" />
                </th>
                <td>
                    <FormattedMessage {...getNullBolleanMessage(treatment.success)} />
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.dead" defaultMessage="dead" />
                </th>
                <td>
                    <FormattedMessage {...getNullBolleanMessage(treatment.dead)} />
                </td>
            </tr>
            {
                treatment.dead
                && (
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.deathMoment" defaultMessage="Death moment" />
                        </th>
                        <td>
                            {treatment.death_moment ? getTreatmentMessage('deathMomentChoices', treatment.death_moment, treatmentChoices) : '--'}
                        </td>
                    </tr>

                )
            }
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.lost" defaultMessage="Lost" />
                </th>
                <td>
                    <FormattedMessage {...getNullBolleanMessage(treatment.lost)} />
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patient.treatment.issues" defaultMessage="Events" />
                </th>
                <td>

                    {
                        (treatment.issues
                            && treatment.issues.length === 1
                            && treatment.issues[0] === ''
                            && treatment.otherIssues === '')
                            && '--'
                    }
                    {
                        (treatment.issues
                        && treatment.issues.length > 0)
                        && (
                            <ul>
                                {
                                    treatment.issues.map((i) => {
                                        if (i !== 'other' && i !== '') {
                                            return (
                                                <li key={i}>
                                                    {
                                                        getTreatmentMessage('issueChoices', i, treatmentChoices)
                                                    }
                                                </li>
                                            );
                                        }
                                        return null;
                                    })
                                }
                                {
                                    treatment.otherIssues && treatment.otherIssues !== ''
                                    && (
                                        <li>
                                            {treatment.otherIssues}
                                        </li>
                                    )
                                }
                            </ul>
                        )
                    }
                    {
                        (!treatment.issues || (treatment.issues && treatment.issues.length === 0)) && '--'
                    }
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patientsCases.device.last_user" defaultMessage="Last user" />
                </th>
                <td>
                    {treatment.device && treatment.device.last_user ? treatment.device.last_user : '--'}
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patientsCases.device.last_team" defaultMessage="Last team" />
                </th>
                <td>
                    {treatment.device && treatment.device.last_team ? treatment.device.last_team : '--'}
                </td>
            </tr>
            <tr>
                <th>
                    <FormattedMessage id="patientsCases.device.id" defaultMessage="Tablette id" />
                </th>
                <td>
                    {treatment.device && treatment.device.device_id ? treatment.device.device_id : '--'}
                </td>
            </tr>
        </tbody>
    </table>
);

TreatmentComponent.propTypes = {
    treatment: PropTypes.object.isRequired,
    treatmentChoices: PropTypes.object.isRequired,
    canEditPatientInfos: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
};
const MapStateToProps = state => ({
    load: state.load,
    patient: state.patients.current,
    testsMapping: state.patients.testsMapping,
    currentUser: state.currentUser.user,
    treatmentChoices: state.patients.treatmentChoices,
});

export default connect(MapStateToProps)(TreatmentComponent);
