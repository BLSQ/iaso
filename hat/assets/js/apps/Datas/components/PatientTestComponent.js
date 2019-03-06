import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from 'react-intl';
import moment from 'moment';
import VideoComponent from '../../../components/VideoComponent';
import ImgModal from '../../../components/ImgModal';

class PatientTestComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: !props.test.hidden,
        };
    }

    toggleContent() {
        if (this.props.test.hidden) {
            this.setState({
                open: !this.state.open,
            });
        }
    }

    render() {
        const {
            test, similarTest, testsMapping, currentCase,
            intl: {
                formatMessage,
            },
        } = this.props;
        if (!test) {
            return null;
        }
        return (
            <div className={`${test.hidden ? 'collapsable' : ''} ${this.state.open ? 'open' : ''}`}>
                <table>
                    <thead
                        className="custom-head"
                        onClick={() => this.toggleContent()}
                    >
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
                                {
                                    test.hidden &&
                                    <strong> <FormattedMessage id="patientsCasesTests.duplicate" defaultMessage="doublon" /></strong>
                                }
                                {
                                    test.hidden &&
                                    this.state.open &&
                                    <i className="fa fa-chevron-down chevron" />
                                }
                                {
                                    test.hidden &&
                                    !this.state.open &&
                                    <i className="fa fa-chevron-right chevron" />
                                }
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                ID
                            </th>
                            <td>
                                {test.id}
                            </td>
                        </tr>
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
                            test.type && (test.type === 'CATT' || test.type === 'RDT') &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.image" defaultMessage="Photo" />
                                </th>
                                <td className={`${(test.image_filename && !test.image) || (!test.image_filename && !test.image) ? 'error-text' : ''} ${test.image ? 'align-center' : ''}`}>
                                    {
                                        !test.image_filename && !test.image &&
                                        <span>
                                            <i className="fa fa-camera small-padding-right" />
                                            <FormattedMessage id="patientsCasesTests.notDoneFem" defaultMessage="Non prise" />
                                        </span>
                                    }
                                    {
                                        test.image_filename && !test.image &&
                                        <span>
                                            <i className="fa fa-upload small-padding-right" />
                                            <FormattedMessage id="patientsCasesTests.notUploadedFem" defaultMessage="Non transmise" />
                                        </span>
                                    }
                                    {
                                        test.image &&
                                        <ImgModal
                                            imgPath={test.image}
                                            altText={formatMessage({
                                                defaultMessage: 'Résultat test dépistage',
                                                id: 'main.screening.result',
                                            })}
                                        />
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.image && test.type === 'CATT' &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.imageIndex" defaultMessage="Index photo" />
                                </th>
                                <td className={!test.index ? 'error-text' : ''}>
                                    {test.index ? test.index : <FormattedMessage id="patientsCasesTests.notCommunicated" defaultMessage="Non communiqué" />}
                                </td>
                            </tr>
                        }
                        {
                            test.type && (test.type !== 'CATT' && test.type !== 'RDT') &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.video" defaultMessage="Vidéo" />
                                </th>
                                <td className={(test.video_filename && !test.video) || (!test.video_filename && !test.video) ? 'error-text' : ''}>
                                    {
                                        !test.video_filename && !test.video &&
                                        <span>
                                            <i className="fa fa-video-camera small-padding-right" />
                                            <FormattedMessage id="patientsCasesTests.notDoneFem" defaultMessage="Non prise" />
                                        </span>
                                    }
                                    {
                                        test.video_filename && !test.video &&
                                        <span>
                                            <i className="fa fa-upload small-padding-right" />
                                            <FormattedMessage id="patientsCasesTests.notUploadedFem" defaultMessage="Non transmise" />
                                        </span>
                                    }
                                    {
                                        test.video &&
                                        <VideoComponent videoItem={
                                            {
                                                video: test.video,
                                            }
                                        }
                                        />
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.type === 'CATT' &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.cattSessiontype" defaultMessage="Type de session" />
                                </th>
                                <td className={!currentCase.test_catt_session_type ? 'error-text' : ''}>
                                    {
                                        currentCase.test_catt_session_type &&
                                        <span>
                                            {
                                                currentCase.test_catt_session_type === 'doorToDoor' &&
                                                <FormattedMessage id="patientsCasesTests.cattSessiontype.doorToDoor" defaultMessage="Porte à porte" />
                                            }
                                            {
                                                (currentCase.test_catt_session_type === 'onTheSpot' || currentCase.test_catt_session_type === 'onSite') &&
                                                <FormattedMessage id="patientsCasesTests.cattSessiontype.onSite" defaultMessage="Sur site" />
                                            }
                                        </span>
                                    }
                                    {
                                        !currentCase.test_catt_session_type &&
                                        <FormattedMessage id="patientsCasesTests.notCommunicated" defaultMessage="Non communiqué" />
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.type === 'PL' &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.test_pl_albumine" defaultMessage="Albumine" />
                                </th>
                                <td>
                                    {
                                        currentCase.test_pl_albumine ? currentCase.test_pl_albumine : '--'
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.type === 'PL' &&
                            <tr>
                                <th>
                                    <FormattedHTMLMessage id="patientsCasesTests.test_pl_gb_mm3" defaultMessage="Globules blancs/mm&sup3;" />
                                </th>
                                <td>
                                    {
                                        currentCase.test_pl_gb_mm3 ? currentCase.test_pl_gb_mm3 : '--'
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.type === 'PL' &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.test_pl_lcr" defaultMessage="LCR" />
                                </th>
                                <td>
                                    {
                                        currentCase.test_pl_lcr ? currentCase.test_pl_lcr : '--'
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.type === 'PL' &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.test_pl_trypanosome" defaultMessage="Trypanosome" />
                                </th>
                                <td>
                                    {
                                        currentCase.test_pl_trypanosome ? currentCase.test_pl_trypanosome : '--'
                                    }
                                </td>
                            </tr>
                        }
                        {
                            test.type === 'PL' &&
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesTests.test_pl_comments" defaultMessage="Commentaires" />
                                </th>
                                <td>
                                    {
                                        currentCase.test_pl_comments ? currentCase.test_pl_comments : '--'
                                    }
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}


PatientTestComponent.defaultProps = {
    similarTest: undefined,
    test: undefined,
    currentCase: undefined,
};


PatientTestComponent.propTypes = {
    test: PropTypes.object,
    testsMapping: PropTypes.object.isRequired,
    similarTest: PropTypes.object,
    currentCase: PropTypes.object,
    intl: PropTypes.object.isRequired,
};

const PatientTestComponentWithIntl = injectIntl(PatientTestComponent);

export default PatientTestComponentWithIntl;
