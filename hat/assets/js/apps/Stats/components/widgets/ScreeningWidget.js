import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Visualization from '../Visualization';
import Donut from '../Donut';

class ScreeningWidget extends Component {
    render() {
        const { total } = this.props;
        const percentagePositiveScreening = total.positive
            ? `${((total.positive / total.total) * 100).toFixed(2)}%`
            : <FormattedMessage id="statspage.none" defaultMessage="none" />;
        const donutValue = total.positive ? total.positive / total.total : 0;

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
                        <div className="column--6 container__graph--6 responsive">
                            <Donut value={donutValue} />
                        </div>
                    </section>
                </div>
            </div>);
    }
}

ScreeningWidget.propTypes = {
    total: PropTypes.object.isRequired,
};

const ScreeningWidgetIntl = injectIntl(ScreeningWidget);

export default ScreeningWidgetIntl;
