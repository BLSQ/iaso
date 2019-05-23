import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class TestImageComponent extends React.Component {
    render() {
        const {
            test, changeResult, testsMapping,
        } = this.props;
        const typeConstant = this.props.test.type === 'RDT' ?
            testsMapping.rdtTypeConstant : testsMapping.cattTypeConstant;
        return (
            <div className={test.current ? 'current' : ''}>
                {
                    !test.index && test.type === 'CATT' &&
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.image.noindex"
                                defaultMessage="aucun index fourni"
                            />
                        </div>
                    </section>
                }
                {
                    test.index && test.type === 'CATT' &&
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.image.index"
                                defaultMessage="Test n°"
                            />:
                        </div>
                        <div>{test.index} - {test.id}</div>
                    </section>
                }
                <section>
                    <div className="quality-label inline">
                        <FormattedMessage
                            id="quality.results"
                            defaultMessage="Résultat"
                        />:
                    </div>
                    {
                        typeConstant.map(type => (
                            <div className="quality-radio" key={type.value}>
                                <input
                                    type="radio"
                                    id={`result-${type.value}-${test.id}`}
                                    name={`result-${type.value}-${test.id} `}
                                    checked={type.value === test.result ? 'checked' : ''}
                                    value={type.value}
                                    onChange={() => changeResult(type.value, test.id)}
                                />
                                <label htmlFor={`result-${type.value}-${test.id}`}>
                                    <span>{type.label}</span>
                                </label>
                            </div>))
                    }
                </section>
            </div>);
    }
}
TestImageComponent.defaultProps = {
    isSuperUser: false,
    isMediumUser: false,
};

TestImageComponent.propTypes = {
    test: PropTypes.object.isRequired,
    changeResult: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    isSuperUser: PropTypes.bool,
    isMediumUser: PropTypes.bool,
    testsMapping: PropTypes.object.isRequired,
};

const TestImageComponentIntl = injectIntl(TestImageComponent);

export default TestImageComponentIntl;
