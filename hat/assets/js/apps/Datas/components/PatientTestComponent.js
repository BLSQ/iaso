import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';
import VideoComponent from '../../../components/VideoComponent';

class PatientCasesTests extends React.Component {
    render() {
        const { test, similarTest, testsMapping } = this.props;
        if (!test) {
            return null;
        }
        return (
            <table>
                <thead className="custom-head">
                    <tr>
                        <th colSpan="2">
                            {
                                test.type && (test.type === 'CATT' || test.type === 'RDT') &&
                                <strong><FormattedMessage id="patientsCasesTests.screening" defaultMessage="Dépistage" /></strong>
                            }
                            {
                                test.type && (test.type !== 'CATT' && test.type !== 'RDT') &&
                                <strong><FormattedMessage id="patientsCasesTests.confirmation" defaultMessage="Confirmation" /></strong>
                            }
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCasesTests.type" defaultMessage="Type de test" />
                        </th>
                        <td className={`${similarTest && (similarTest.type !== test.type) ? 'error' : ''}`}>
                            {test.type ? test.type : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCasesTests.date" defaultMessage="Date" />
                        </th>
                        <td className={`${test.date && similarTest && similarTest.date && (moment(similarTest.date).format('DD-MM-YYYY') !== moment(test.date).format('DD-MM-YYYY')) ? 'error' : ''}`}>
                            {test.date ? moment(test.date).format('DD-MM-YYYY') : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCasesTests.hour" defaultMessage="Heure" />
                        </th>
                        <td className={`${test.date && similarTest && similarTest.date && (moment(similarTest.date).format('HH:mm') !== moment(test.date).format('HH:mm')) ? 'error' : ''}`}>
                            {test.date ? moment(test.date).format('HH:mm') : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCasesTests.result" defaultMessage="Résultat" />
                        </th>
                        <td className={`${similarTest && (similarTest.result !== test.result) ? 'error' : ''}`}>
                            {test.result && testsMapping[test.result] ? testsMapping[test.result] : ''}
                        </td>
                    </tr>

                    {
                        test.image &&
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCasesTests.image" defaultMessage="Photo" />
                            </th>
                            <td>
                                <img src={test.image} alt="" />
                            </td>
                        </tr>
                    }
                    {
                        test.image && test.type === 'CATT' &&
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCasesTests.imageIndex" defaultMessage="Index photo" />
                            </th>
                            <td>
                                {test.index}
                            </td>
                        </tr>
                    }
                    {
                        test.video &&
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCasesTests.video" defaultMessage="Vidéo" />
                            </th>
                            <td>
                                <VideoComponent videoItem={
                                    {
                                        video: test.video,
                                    }
                                }
                                />
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        );
    }
}


PatientCasesTests.defaultProps = {
    similarTest: undefined,
    test: undefined,
};


PatientCasesTests.propTypes = {
    test: PropTypes.object,
    testsMapping: PropTypes.object.isRequired,
    similarTest: PropTypes.object,
};

const PatientCasesTestsWithIntl = injectIntl(PatientCasesTests);

export default PatientCasesTestsWithIntl;
