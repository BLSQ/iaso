import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import SuperUserImageItem from './SuperUserImageItem';

export const getResult = (value, list) => {
    const item = list.find(e => e.value === value);
    return item ? item.label : value;
};

class SuperUserImageComponent extends React.Component {
    render() {
        const {
            currentTest,
            testsMapping,
            intl: {
                formatMessage,
            },
        } = this.props;

        const typeConstant = currentTest.type === 'RDT' ?
            testsMapping.rdtTypeConstant : testsMapping.cattTypeConstant;

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
                        <FormattedMessage id="quality.initialTest" defaultMessage="Inital result" />
                        <span className="date">
                            <FormattedMessage id="main.label.date" defaultMessage="Date" />:
                            {` ${moment(currentTest.date).format('DD-MM-YYYY')}`}
                        </span>
                    </h4>
                    <div>
                        <div className="quality-label inline">
                            <FormattedMessage id="main.label.tester" defaultMessage="Tester" />:
                        </div>
                        <span>
                            {currentTest.tester.firstName} {' '}
                            {currentTest.tester.lastName} {' '}
                            {currentTest.tester.userName}
                        </span>
                    </div>
                    <div>
                        <div className="quality-label inline">
                            <FormattedMessage id="main.label.devices" defaultMessage="Device" />:
                        </div>
                        <span>
                            {currentTest.device ? currentTest.device : '--'}
                        </span>
                    </div>
                    <div>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="main.label.result"
                                defaultMessage="Result"
                            />:
                        </div>
                        <span>
                            {currentTest.result ? getResult(currentTest.result, typeConstant) : <FormattedMessage id="quality.noresult" defaultMessage="Pas de résultat" /> }
                        </span>
                    </div>
                </section>
                {
                    check1 &&
                    <SuperUserImageItem
                        typeConstant={typeConstant}
                        currentTest={check1}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'main.label.validation',
                        })} 1`}
                    />
                }
                {
                    check2 &&
                    <SuperUserImageItem
                        typeConstant={typeConstant}
                        currentTest={check2}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'main.label.validation',
                        })} 2`}
                    />
                }
                {
                    check3 &&
                    <SuperUserImageItem
                        typeConstant={typeConstant}
                        currentTest={check3}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'main.label.validation',
                        })} 3`}
                    />
                }
            </Fragment>);
    }
}

SuperUserImageComponent.propTypes = {
    currentTest: PropTypes.object.isRequired,
    testsMapping: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const SuperUserImageComponentIntl = injectIntl(SuperUserImageComponent);

export default SuperUserImageComponentIntl;
