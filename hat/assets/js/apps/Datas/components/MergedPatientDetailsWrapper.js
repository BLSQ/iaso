import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import PatientInfos from './PatientInfos';
import PatientCasesInfos from './PatientCasesInfos';
import PatientCasesLocation from './PatientCasesLocation';
import PatientTestComponent from './PatientTestComponent';
import TreatmentComponent from './TreatmentComponent';

class MergedPatientDetailsWrapper extends React.Component {
    render() {
        const {
            mergedPatient,
            testsMapping,
            conflicts,
        } = this.props;
        return (
            <section className="duplicate-page result">
                <table className={`no-style duplicate-table ${mergedPatient.cases.length > 0 ? 'margin-bottom' : ''}`}>
                    <thead>
                        <tr>
                            <td>
                                <h2 className="widget__heading">
                                    <FormattedMessage id="main.label.result" defaultMessage="Résultat" />
                                </h2>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <PatientInfos
                                    patient={mergedPatient}
                                    conflicts={conflicts}
                                    isResult
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                {
                    mergedPatient.cases.map(caseItem => (
                        <section key={caseItem.id}>
                            <table className="no-style duplicate-table tests">
                                <thead>
                                    <tr>
                                        <td>
                                            <h2 className="widget__heading">
                                                <span className="case-id">
                                                    <span>Hat ID</span>
                                                    :
                                                    {' '}
                                                    {caseItem.hat_id}
                                                </span>
                                            </h2>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <PatientCasesInfos
                                                currentCase={caseItem}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <PatientCasesLocation currentCase={caseItem} />
                                        </td>
                                    </tr>
                                    {caseItem.tests.map((t) => {
                                        let similarTest;
                                        return (
                                            <tr key={t.id}>
                                                <td>
                                                    <PatientTestComponent currentCase={caseItem} test={t} similarTest={similarTest} testsMapping={testsMapping} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </section>
                    ))
                }
                {
                    mergedPatient.treatments.length > 0
                    && (
                        <section>
                            <table className="no-style duplicate-table">
                                <thead>
                                    <tr>
                                        <td>
                                            <h2 className="widget__heading">
                                                <FormattedMessage id="datas.treatments.header.title" defaultMessage="Traitement(s)" />
                                                :
                                            </h2>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        mergedPatient.treatments.map(t => (
                                            <tr key={`treatement${t.id}`}>
                                                <td>
                                                    <TreatmentComponent
                                                        treatment={t}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </section>
                    )
                }
            </section>
        );
    }
}


MergedPatientDetailsWrapper.propTypes = {
    mergedPatient: PropTypes.object.isRequired,
    testsMapping: PropTypes.object.isRequired,
    conflicts: PropTypes.array.isRequired,
};

const DuplicatePatientDetailsWrapperWithIntl = injectIntl(MergedPatientDetailsWrapper);

export default DuplicatePatientDetailsWrapperWithIntl;
