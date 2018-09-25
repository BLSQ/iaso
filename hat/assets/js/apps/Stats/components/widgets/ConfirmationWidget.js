import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Donut from '../Donut';

class ConfirmationWidget extends Component {
    render() {
        const { total } = this.props;

        const percentagePositiveConfirmation = total.positive_confirmations
            ? `${((total.positive_confirmations / total.positive_screenings) * 100).toFixed(2)}%`
            : <FormattedMessage id="statspage.none" defaultMessage="none" />;
        const donutValue = total.positive_confirmations ? total.positive_confirmations / total.positive_screenings : 0;

        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="statspage.confirmation.header.results" defaultMessage="Confirmation tests" />
                    </h2>
                </div>
                <div className="widget__content">
                    <section className="wrapper__column">
                        <div className="column--4">
                            <h2 className="block--margin-bottom--xs">
                                {percentagePositiveConfirmation}
                                &nbsp;
                                <FormattedMessage id="statspage.confirmation.subheader" defaultMessage="HAT confirmed" />
                            </h2>
                            <p>
                                <FormattedMessage id="statspage.confirmation.description2" defaultMessage="Pourcentage de dépistages positifs avec une confirmation positive (PG, mAECT, CTC/WOO, or GE)" />
                            </p>
                            <ul className="list--stats--reduced">
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.confirmation.count.pos" defaultMessage="Number of participants confirmed positive for HAT" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.positive_confirmations}
                                    </span>
                                </li>
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.confirmation.count.neg" defaultMessage="Number of participants confirmed negative for HAT" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.negative_confirmations}
                                    </span>
                                </li>
                            </ul>
                            <span className="text--explanation">
                                <FormattedMessage
                                    id="statspage.confirmation.count.total2"
                                    defaultMessage="Avec un total de {totalParticipants} dépistages positifs."
                                    values={{ totalParticipants: total.positive_screenings }}
                                />
                            </span>
                        </div>
                        <div className="column--6 container__graph--6 responsive">
                            <Donut value={donutValue} />
                        </div>
                    </section>
                </div>
            </div>);
    }
}

ConfirmationWidget.propTypes = {
    total: PropTypes.object.isRequired,
};

const ConfirmationWidgetIntl = injectIntl(ConfirmationWidget);

export default ConfirmationWidgetIntl;
