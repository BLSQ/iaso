import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';
import { CattTypeConstant, RdtTypeConstant } from '../../../utils/constants/ImageTypeConstant';

const getResult = (value, list) => list.find(e => e.value === value);

class SuperUserComponent extends React.Component {
    render() {
        const {
            currentTest,
            intl: {
                formatMessage,
            },
        } = this.props;
        const typeConstant = currentTest.type === 'RDT' ?
            RdtTypeConstant : CattTypeConstant;
        let check1;
        let check2;
        let check3;
        if (currentTest.checks.length > 0) {
            check1 = currentTest.checks.find(t => t.level === 10);
            check2 = currentTest.checks.find(t => t.level === 20);
            check3 = currentTest.checks.find(t => t.level === 30);
        }
        return (
            <Fragment>
                <section className="test-infos">
                    <h4>
                        <FormattedMessage id="quality.initialTest" defaultMessage="Résultat Initial" />
                        <span className="date">
                            <FormattedMessage id="quality.date" defaultMessage="Date" />:
                            {` ${moment(currentTest.date).format('DD-MM-YYYY')}`}
                        </span>
                    </h4>
                    <div>
                        <div className="quality-label inline">
                            <FormattedMessage id="quality.tester" defaultMessage="Testeur" />:
                        </div>
                        <span>
                            {currentTest.tester.firstName} {' '}
                            {currentTest.tester.lastName} {' '}
                            {currentTest.tester.userName}
                        </span>
                    </div>
                    <div>
                        <div className="quality-label inline">
                            <FormattedMessage id="quality.device" defaultMessage="Tablette" />:
                        </div>
                        <span>
                            {currentTest.device ? currentTest.device : '--'}
                        </span>
                    </div>
                    <div>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.results"
                                defaultMessage="Résultat"
                            />:
                        </div>
                        <span>
                            {formatMessage(getResult(currentTest.result, typeConstant))}
                        </span>
                    </div>
                </section>
                {
                    check1 &&
                    <section className="test-infos">
                        <h4>
                            <FormattedMessage id="quality.check" defaultMessage="Validation" /> 1
                            <span className="date">
                                <FormattedMessage id="quality.date" defaultMessage="Date" />:
                                {` ${moment(check1.updated_at).format('DD-MM-YYYY')}`}
                            </span>
                        </h4>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage id="quality.user" defaultMessage="Utilisateur" />:
                            </div>
                            <span>
                                {check1.validator.firstName} {' '}
                                {check1.validator.lastName} {' '}
                                {check1.validator.userName}
                            </span>
                        </div>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.results"
                                    defaultMessage="Résultat"
                                />:
                            </div>
                            <span>
                                {formatMessage(getResult(check1.result, typeConstant))}
                            </span>
                        </div>
                    </section>
                }
                {
                    check2 &&
                    <section className="test-infos">
                        <h4>
                            <FormattedMessage id="quality.check" defaultMessage="Validation" /> 2
                            <span className="date">
                                <FormattedMessage id="quality.date" defaultMessage="Date" />:
                                {` ${moment(check2.updated_at).format('DD-MM-YYYY')}`}
                            </span>
                        </h4>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage id="quality.user" defaultMessage="Utilisateur" />:
                            </div>
                            <span>
                                {check2.validator.firstName} {' '}
                                {check2.validator.lastName} {' '}
                                {check2.validator.userName}
                            </span>
                        </div>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.results"
                                    defaultMessage="Résultat"
                                />:
                            </div>
                            <span>
                                {formatMessage(getResult(check2.result, typeConstant))}
                            </span>
                        </div>
                        <div className="comment-container">
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.comment"
                                    defaultMessage="Commentaire"
                                />:
                            </div>
                            <span>
                                {check2.comment}
                            </span>
                        </div>
                    </section>
                }
                {
                    check3 &&
                    <section className="test-infos">
                        <h4>
                            <FormattedMessage id="quality.check" defaultMessage="Validation" /> 3
                            <span className="date">
                                <FormattedMessage id="quality.date" defaultMessage="Date" />:
                                {` ${moment(check3.updated_at).format('DD-MM-YYYY')}`}
                            </span>
                        </h4>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage id="quality.user" defaultMessage="Utilisateur" />:
                            </div>
                            <span>
                                {check3.validator.firstName} {' '}
                                {check3.validator.lastName} {' '}
                                {check3.validator.userName}
                            </span>
                        </div>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.results"
                                    defaultMessage="Résultat"
                                />:
                            </div>
                            <span>
                                {formatMessage(getResult(check3.result, typeConstant))}
                            </span>
                        </div>
                        <div className="comment-container">
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.comment"
                                    defaultMessage="Commentaire"
                                />:
                            </div>
                            <span>
                                {check3.comment}
                            </span>
                        </div>
                    </section>
                }
            </Fragment>);
    }
}

SuperUserComponent.propTypes = {
    currentTest: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const SuperUserComponentIntl = injectIntl(SuperUserComponent);

export default SuperUserComponentIntl;
