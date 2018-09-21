import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Donut from '../Donut';

class ParticipationWidget extends Component {
    render() {
        const { coverage } = this.props;
        const totalVillages = coverage.total_visited || '0';
        const villagesWithEstimate = coverage.visited_with_population || '0';
        const population = coverage.estimated_village_population || 0;
        const registered = coverage.screening_count || 0;
        const percentageScreened = registered
            ? `${((registered / population) * 100).toFixed(2)}%`
            : <FormattedMessage id="statspage.none" defaultMessage="none" />;
        const donutValue = registered ? registered / population : 0;

        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="statspage.participation.header" defaultMessage="Proportion of population screened" />
                    </h2>
                </div>
                <div className="widget__content">
                    <section className="wrapper__column">
                        <div className="column--4">
                            <h2 className="block--margin-bottom--xs">
                                <FormattedMessage id="statspage.participation.subheader" defaultMessage="Participation rate" />
                                {':'}
                                &nbsp;
                                {percentageScreened}
                            </h2>
                            <p>
                                <FormattedMessage id="statspage.participation.description" defaultMessage="The percentage of the target population of the screened areas for this time period" />
                            </p>
                            <ul className="list--stats--reduced">
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.participation.registered" defaultMessage="Number of participants registered" />
                                    </span>
                                    <span className="list__item__number--prominent">{registered}</span>
                                </li>
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.participation.totalpop" defaultMessage="Total population of screened areas (estimate)" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {population}
                                    </span>
                                </li>
                            </ul>
                            <span className="text--explanation">
                                <FormattedMessage
                                    id="statspage.participation.explanation"
                                    defaultMessage="There are {totalVillages} villages in this selection, but only {villagesWithEstimate} have population data. The participation rate is calculated using only these {villagesWithEstimate} villages."
                                    values={{ totalVillages, villagesWithEstimate }}
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


ParticipationWidget.propTypes = {
    coverage: PropTypes.object.isRequired,
};


const ParticipationWidgetIntl = injectIntl(ParticipationWidget);

export default ParticipationWidgetIntl;
