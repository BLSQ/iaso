import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Visualization from '../Visualization';

class ConfirmationWidget extends Component {
    render() {
        const { timeseries, total } = this.props;
        const percentagePositiveConfirmation = total.positive
            ? `${Math.round(total.positive / (total.total * 10000)) / 100}%`
            : <FormattedMessage id="statspage.none" defaultMessage="none" />;
        const spec = {
            x_accessor: 'date',
            y_accessor: ['confirmation_pos', 'confirmation_neg', 'confirmation_total'],
            // legend: ['positive', 'negative', 'total'],
            right: 40,
            top: 20,
        };
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
                                <FormattedMessage id="statspage.confirmation.description" defaultMessage="The percentage of participants tested who had a positive confirmation test (PG, mAECT, CTC/WOO, or GE)" />
                            </p>
                            <ul className="list--stats--reduced">
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.confirmation.count.pos" defaultMessage="Number of participants confirmed positive for HAT" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.positive}
                                    </span>
                                </li>
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.confirmation.count.neg" defaultMessage="Number of participants confirmed negative for HAT" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.negative}
                                    </span>
                                </li>
                            </ul>
                            <span className="text--explanation">
                                <FormattedMessage
                                    id="statspage.confirmation.count.total"
                                    defaultMessage="Out of an overall total of {totalParticipants} participants registered."
                                    values={{ totalParticipants: total.total }}
                                />
                            </span>
                        </div>
                        <div className="column--6 container__graph--6 responsive">
                            <Visualization data={timeseries} spec={spec} />
                        </div>
                    </section>
                </div>
            </div>);
    }
}

ConfirmationWidget.propTypes = {
    timeseries: PropTypes.array.isRequired,
    total: PropTypes.object.isRequired,
};

const ConfirmationWidgetIntl = injectIntl(ConfirmationWidget);

export default ConfirmationWidgetIntl;
