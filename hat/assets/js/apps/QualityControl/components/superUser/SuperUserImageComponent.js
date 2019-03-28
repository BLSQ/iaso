import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import SuperUserImageItem from './SuperUserImageItem';
import { CattTypeConstant, RdtTypeConstant } from '../../../../utils/constants/ImageTypeConstant';

const getResult = (value, list) => list.find(e => e.value === value);

class SuperUserImageComponent extends React.Component {
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
                    <SuperUserImageItem
                        currentTest={check1}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'quality.check',
                        })} 1`}
                    />
                }
                {
                    check2 &&
                    <SuperUserImageItem
                        currentTest={check2}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'quality.check',
                        })} 2`}
                    />
                }
                {
                    check3 &&
                    <SuperUserImageItem
                        currentTest={check3}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'quality.check',
                        })} 3`}
                    />
                }
            </Fragment>);
    }
}

SuperUserImageComponent.propTypes = {
    currentTest: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const SuperUserImageComponentIntl = injectIntl(SuperUserImageComponent);

export default SuperUserImageComponentIntl;
