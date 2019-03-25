import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { CattTypeConstant, RdtTypeConstant } from '../../../utils/constants/ImageTypeConstant';


class TestImageComponent extends React.Component {
    render() {
        const typeConstant = this.props.test.type === 'RDT' ?
            RdtTypeConstant : CattTypeConstant;
        const { test, changeResult } = this.props;
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
                    test.index &&
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.image.index"
                                defaultMessage="Test n°:"
                            />:
                        </div>
                        <div>{test.index}</div>
                    </section>
                }
                <section>
                    <div className="quality-label inline">
                        <FormattedMessage
                            id="quality.image.results"
                            defaultMessage="Résultat"
                        />:
                    </div>
                    {
                        typeConstant.map((type) => {
                            const messageProps = {
                                id: type.id,
                                defaultMessage: type.defaultMessage,
                            };
                            return (
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
                                        <FormattedMessage {...messageProps} />
                                    </label>
                                </div>
                            );
                        })
                    }
                </section>
            </div>);
    }
}

TestImageComponent.propTypes = {
    test: PropTypes.object.isRequired,
    changeResult: PropTypes.func.isRequired,
};

const TestImageComponentIntl = injectIntl(TestImageComponent);

export default TestImageComponentIntl;
