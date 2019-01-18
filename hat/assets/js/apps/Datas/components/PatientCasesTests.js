import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import PatientTestComponent from './PatientTestComponent';

class PatientCasesTests extends React.Component {
    render() {
        const { tests, testsMapping, similarCase } = this.props;
        if (!tests || tests.length === 0) {
            return null;
        }
        return (
            <div className="patient-infos-container no-padding-left no-padding-top no-padding-right test-container">
                {
                    tests.map((t, index) => {
                        let similarTest;
                        if (similarCase && similarCase.tests) {
                            similarTest = similarCase.tests[index];
                        }
                        return (
                            <div key={t.id}>
                                <PatientTestComponent
                                    test={t}
                                    similarTest={similarTest}
                                    testsMapping={testsMapping}
                                />
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}


PatientCasesTests.defaultProps = {
    similarCase: undefined,
    tests: [],
};


PatientCasesTests.propTypes = {
    tests: PropTypes.array,
    testsMapping: PropTypes.object.isRequired,
    similarCase: PropTypes.object,
};

const PatientCasesTestsWithIntl = injectIntl(PatientCasesTests);

export default PatientCasesTestsWithIntl;
