import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class TestVideoComponent extends React.Component {
    render() {
        const {
            changeOption,
            isClear,
            isGoodPlace,
            isConfirmedCase,
            hasOtherParasite,
            isSuperUser,
        } = this.props;
        return (
            <div>
                {
                    isSuperUser &&
                    <section>
                        <h4>
                            <FormattedMessage
                                id="quality.finalCheck"
                                defaultMessage="Vérification finale"
                            />
                        </h4>
                    </section>
                }
                <section>
                    <div className="quality-label inline">
                        <FormattedMessage
                            id="quality.main.isClear"
                            defaultMessage="Netteté"
                        />:
                    </div>
                    <div className="quality-radio">
                        <input
                            type="radio"
                            name="isClear"
                            value={isClear}
                            checked={isClear ? 'checked' : ''}
                            onChange={() => changeOption('isClear')}
                        />
                        <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                    </div>
                    <div className="quality-radio">
                        <input
                            type="radio"
                            name="isClear"
                            value={isClear}
                            checked={!isClear ? 'checked' : ''}
                            onChange={() => changeOption('isClear')}
                        />
                        <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                    </div>
                </section>
                {
                    isClear &&
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.main.search"
                                defaultMessage="Recherche parasite au bon endroit"
                            />:
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="isGoodPlace"
                                value={isGoodPlace}
                                checked={isGoodPlace ? 'checked' : ''}
                                onChange={() => changeOption('isGoodPlace')}
                            />
                            <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="isGoodPlace"
                                value={isGoodPlace}
                                checked={!isGoodPlace ? 'checked' : ''}
                                onChange={() => changeOption('isGoodPlace')}
                            />
                            <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                        </div>
                    </section>
                }

                {
                    isClear &&
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.main.confirm"
                                defaultMessage="Confirmation vue trypanosome"
                            />:
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="isConfirmedCase"
                                value={isConfirmedCase}
                                checked={isConfirmedCase ? 'checked' : ''}
                                onChange={() => changeOption('isConfirmedCase')}
                            />
                            <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="isConfirmedCase"
                                value={isConfirmedCase}
                                checked={!isConfirmedCase ? 'checked' : ''}
                                onChange={() => changeOption('isConfirmedCase')}
                            />
                            <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                        </div>
                    </section>
                }

                <section>
                    <div className="quality-label inline">
                        <FormattedMessage
                            id="quality.main.otherParasites"
                            defaultMessage="Autre parasite"
                        />:
                    </div>
                    <div className="quality-radio">
                        <input
                            type="radio"
                            name="hasOtherParasite"
                            value={hasOtherParasite}
                            checked={hasOtherParasite ? 'checked' : ''}
                            onChange={() => changeOption('hasOtherParasite')}
                        />
                        <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                    </div>
                    <div className="quality-radio">
                        <input
                            type="radio"
                            name="hasOtherParasite"
                            value={hasOtherParasite}
                            checked={!hasOtherParasite ? 'checked' : ''}
                            onChange={() => changeOption('hasOtherParasite')}
                        />
                        <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                    </div>
                </section>
            </div>);
    }
}

TestVideoComponent.propTypes = {
    changeOption: PropTypes.func.isRequired,
    isClear: PropTypes.bool.isRequired,
    isGoodPlace: PropTypes.bool.isRequired,
    isConfirmedCase: PropTypes.bool.isRequired,
    hasOtherParasite: PropTypes.bool.isRequired,
    isSuperUser: PropTypes.bool.isRequired,
};

const TestVideoComponentIntl = injectIntl(TestVideoComponent);

export default TestVideoComponentIntl;
