import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedHTMLMessage, FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';
import VideoComponent from '../../../components/VideoComponent';
import ImgModal from '../../../components/ImgModal';
import { getTesterDisplayName } from '../../../utils/profilesUtils';

class PatientTestComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.test && !props.test.hidden,
        };
    }

    toggleContent() {
        if (this.props.test && this.props.test.hidden) {
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
            canEditPatientInfos,
            toggleModal,
            isFixedStructure,
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
                                    test.type && (test.type === 'CATT' || test.type === 'RDT')
                                    && <strong><FormattedMessage id="main.label.screening_result" defaultMessage="Dépistage" /></strong>
                                }
                                {
                                    test.type && (test.type !== 'CATT' && test.type !== 'RDT' && test.type !== 'PL')
                                    && <strong><FormattedMessage id="main.label.confirmation_result" defaultMessage="Confirmation" /></strong>
                                }
                                {
                                    test.type && test.type === 'PL'
                                    && <strong><FormattedMessage id="main.label.stageTest" defaultMessage="Stage" /></strong>
                                }
                                {
                                    test.hidden
                                    && (
                                        <strong>
                                            {' '}
                                            <FormattedMessage id="main.label.duplicate_single" defaultMessage="duplicate" />
                                        </strong>
                                    )
                                }
                                {
                                    test.hidden
                                    && this.state.open
                                    && <i className="fa fa-chevron-down chevron" />
                                }
                                {
                                    test.hidden
                                    && !this.state.open
                                    && <i className="fa fa-chevron-right chevron" />
                                }

                                {
                                    canEditPatientInfos
                                    && (
                                        <span
                                            tabIndex={0}
                                            role="button"
                                            className="edit-button"
                                            onClick={() => toggleModal(test)}
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
                                ID
                            </th>
                            <td>
                                {test.id}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.testType" defaultMessage="Test type" />
                            </th>
                            <td className={`${similarTest && (similarTest.type !== test.type) ? 'error' : ''}`}>
                                {test.type ? test.type : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.date" defaultMessage="Date" />
                            </th>
                            <td className={`${test.date && similarTest && similarTest.date && (moment(similarTest.date)
                                .format('DD-MM-YYYY HH:mm') !== moment(test.date)
                                .format('DD-MM-YYYY HH:mm')) ? 'error' : ''}`}
                            >
                                {test.date ? moment(test.date).format('DD-MM-YYYY HH:mm') : '--'}
                            </td>
                        </tr>
                        {
                            test.type === 'CATT'
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.index" defaultMessage="Index" />
                                    </th>
                                    <td className={!test.index ? 'error-text' : ''}>
                                        {test.index ? test.index : <FormattedMessage id="main.label.notCommunicated" defaultMessage="Not communicated" />}
                                    </td>
                                </tr>
                            )
                        }
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.test.tester" defaultMessage="Testeur" />
                            </th>
                            <td>
                                {getTesterDisplayName(test.tester)}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                {
                                    test.type && test.type === 'PL'
                                    && <FormattedMessage id="patientsCasesTests.plResult" defaultMessage="Présence trypanosomes" />
                                }
                                {
                                    test.type && test.type !== 'PL'
                                    && <FormattedMessage id="main.label.result" defaultMessage="Result" />
                                }
                            </th>
                            <td className={`${similarTest && (similarTest.result !== test.result) ? 'error' : ''}`}>
                                {test.result && testsMapping[test.result] ? testsMapping[test.result] : ''}
                            </td>
                        </tr>

                        {
                            test.type && (test.type === 'CATT' || test.type === 'RDT')
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.photo" defaultMessage="Photo" />
                                    </th>
                                    <td className={`${(test.image_filename && !test.image) || (!test.image_filename && !test.image) ? 'error-text' : ''} ${test.image ? 'align-center' : ''}`}>
                                        {
                                            !test.image_filename && !test.image
                                            && (
                                                <span>
                                                    <i className="fa fa-camera small-padding-right" />
                                                    <FormattedMessage id="main.label.notDoneFem" defaultMessage="Non prise" />
                                                </span>
                                            )
                                        }
                                        {
                                            test.image_filename && !test.image
                                            && (
                                                <span>
                                                    <i className="fa fa-upload small-padding-right" />
                                                    <FormattedMessage id="main.label.notUploadedFem" defaultMessage="Non transmise" />
                                                </span>
                                            )
                                        }
                                        {
                                            test.image
                                            && (
                                                <ImgModal
                                                    imgPath={test.image}
                                                    altText={formatMessage({
                                                        defaultMessage: 'Screening result',
                                                        id: 'main.label.screening_result_long',
                                                    })}
                                                />
                                            )
                                        }
                                    </td>
                                </tr>
                            )
                        }
                        {
                            test.type === 'CATT'
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCasesTests.cattSessiontype" defaultMessage="Session type" />
                                    </th>
                                    <td className={!currentCase.test_catt_session_type ? 'error-text' : ''}>
                                        {
                                            currentCase.test_catt_session_type
                                            && (
                                                <span>
                                                    {
                                                        currentCase.test_catt_session_type === 'doorToDoor'
                                                        && <FormattedMessage id="patientsCasesTests.cattSessiontype.doorToDoor" defaultMessage="Door to door" />
                                                    }
                                                    {
                                                        (currentCase.test_catt_session_type === 'onTheSpot' || currentCase.test_catt_session_type === 'onSite')
                                                        && <FormattedMessage id="patientsCasesTests.cattSessiontype.onSite" defaultMessage="On site" />
                                                    }
                                                </span>
                                            )
                                        }
                                        {
                                            !currentCase.test_catt_session_type
                                            && <FormattedMessage id="main.label.notCommunicated" defaultMessage="Not communicated" />
                                        }
                                    </td>
                                </tr>
                            )
                        }
                        {
                            test.type === 'PL'
                            && (
                                <Fragment>
                                    <tr>
                                        <th>
                                            <FormattedHTMLMessage id="patientsCasesTests.test_pl_gb_mm3" defaultMessage="White blood cells/mm&sup3;" />
                                        </th>
                                        <td>
                                            {
                                                currentCase.test_pl_gb_mm3 ? currentCase.test_pl_gb_mm3 : '--'
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="patientsCasesTests.test_pl_albumine" defaultMessage="Albumin" />
                                        </th>
                                        <td>
                                            {
                                                currentCase.test_pl_albumine ? currentCase.test_pl_albumine : '--'
                                            }
                                        </td>
                                    </tr>
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
                                    <tr>
                                        <th>
                                            <FormattedMessage id="main.label.comments" defaultMessage="Comments" />
                                        </th>
                                        <td>
                                            {
                                                currentCase.test_pl_comments ? currentCase.test_pl_comments : '--'
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedHTMLMessage id="main.label.stage" defaultMessage="Stade" />
                                        </th>
                                        <td>
                                            {
                                                currentCase.test_pl_result === 'stage1' ? '1' : ''
                                            }
                                            {
                                                currentCase.test_pl_result === 'stage2' ? '2' : ''
                                            }
                                            {
                                                !currentCase.test_pl_result ? '--' : ''
                                            }
                                            {
                                                currentCase.test_pl_result === 'unknown'
                                                    ? <FormattedMessage id="main.label.unknown" defaultMessage="Inconnu" /> : ''
                                            }
                                        </td>
                                    </tr>
                                </Fragment>
                            )
                        }
                        {
                            test.type && (test.type !== 'CATT' && test.type !== 'RDT')
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.video" defaultMessage="Video" />
                                    </th>
                                    <td className={(test.video_filename && !test.video) || (!test.video_filename && !test.video) ? 'error-text' : ''}>
                                        {
                                            !test.video_filename && !test.video
                                            && (
                                                <span>
                                                    <i className="fa fa-video-camera small-padding-right" />
                                                    <FormattedMessage id="main.label.notDoneFem" defaultMessage="Non prise" />
                                                </span>
                                            )
                                        }
                                        {
                                            test.video_filename && !test.video
                                            && (
                                                <span>
                                                    <i className="fa fa-upload small-padding-right" />
                                                    <FormattedMessage id="main.label..notUploadedFem" defaultMessage="Non transmise" />
                                                </span>
                                            )
                                        }
                                        {
                                            test.video
                                            && (
                                                <VideoComponent videoItem={
                                                    {
                                                        video: test.video,
                                                    }
                                                }
                                                />
                                            )
                                        }
                                    </td>
                                </tr>
                            )
                        }
                        {
                            !isFixedStructure
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.latitudeLongitude" defaultMessage="Latitude/Longitude" />
                                    </th>
                                    <td className={!test.latitude ? 'error-text' : ''}>
                                        <span className="inline-block margin-right--tiny">
                                            {
                                                test.latitude
                                                    ? `${test.latitude}°`
                                                    : <FormattedMessage id="main.label.notCommunicated" defaultMessage="Not communicated" />
                                            }
                                        </span>
                                        <span className="inline-block">
                                            {
                                                test.longitude
                                                    ? `${test.longitude}°`
                                                    : ''
                                            }
                                        </span>
                                    </td>
                                </tr>
                            )
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
    canEditPatientInfos: false,
    toggleModal: () => null,
};


PatientTestComponent.propTypes = {
    test: PropTypes.object,
    testsMapping: PropTypes.object.isRequired,
    similarTest: PropTypes.object,
    currentCase: PropTypes.object,
    intl: PropTypes.object.isRequired,
    canEditPatientInfos: PropTypes.bool,
    toggleModal: PropTypes.func,
    isFixedStructure: PropTypes.bool.isRequired,
};

const PatientTestComponentWithIntl = injectIntl(PatientTestComponent);

export default PatientTestComponentWithIntl;
