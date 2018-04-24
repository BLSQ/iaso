import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Visualization from '../Visualization';

class ScreeningWidget extends Component {
    render() {
        const { timeseries, total } = this.props;
        const percentagePositiveScreening = total.positive
            ? `${Math.round(total.positive / (total.total * 10000)) / 100}%`
            : <FormattedMessage id="statspage.none" defaultMessage="none" />;
        const spec = {
            x_accessor: 'date',
            y_accessor: ['screening_pos', 'screening_neg', 'screening_total'],
            // legend: ['positive', 'negative', 'total'],
            right: 40,
            top: 20,
        };
        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="statspage.screening.header.results" defaultMessage="Screening tests" />
                    </h2>
                </div>
                <div className="widget__content">
                    <section className="wrapper__column">
                        <div className="column--4">
                            <h2 className="block--margin-bottom--xs">
                                {percentagePositiveScreening}
                                &nbsp;
                                <FormattedMessage id="statspage.screening.subheader" defaultMessage="HAT probable" />
                            </h2>
                            <p>
                                <FormattedMessage id="statspage.screening.description" defaultMessage="The percentage of participants tested who had a positive screening test (CATT or RDT)" />
                            </p>
                            <ul className="list--stats--reduced">
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.screening.count.pos" defaultMessage="Number of participants with a positive screening result" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.positive}
                                    </span>
                                </li>
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.screening.count.neg" defaultMessage="Number of participants with a negative screening result" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.negative}
                                    </span>
                                </li>
                            </ul>
                            <span className="text--explanation">
                                <FormattedMessage
                                    id="statspage.screening.count.total"
                                    defaultMessage="Out of an overall total of {totalParticipants} participants registered."
                                    values={{ totalParticipants: total.total }}
                                />
                            </span>
                        </div>
                        <div className="column--6 container__graph--6">
                            <Visualization data={timeseries} spec={spec} />
                        </div>
                    </section>
                </div>
            </div>);
    }
}

ScreeningWidget.propTypes = {
    timeseries: PropTypes.array.isRequired,
    total: PropTypes.object.isRequired,
};

const ScreeningWidgetIntl = injectIntl(ScreeningWidget);

export default ScreeningWidgetIntl;
