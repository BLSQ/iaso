import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import SuperUserVideoItem from './SuperUserVideoItem';

class SuperUserVideoComponent extends React.Component {
    render() {
        const {
            currentTest,
            intl: {
                formatMessage,
            },
        } = this.props;
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
                {
                    check1 &&
                    <SuperUserVideoItem
                        currentTest={check1}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'quality.check',
                        })} 1`}
                    />
                }
                {
                    check2 &&
                    <SuperUserVideoItem
                        currentTest={check2}
                        title={`${formatMessage({
                            defaultMessage: 'Validation',
                            id: 'quality.check',
                        })} 2`}
                    />
                }
                {
                    check3 &&
                    <SuperUserVideoItem
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

SuperUserVideoComponent.propTypes = {
    currentTest: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(SuperUserVideoComponent);
