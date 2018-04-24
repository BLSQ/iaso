import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Visualization from '../Visualization';

class StageWidget extends Component {
    render() {
        const { timeseries, total } = this.props;
        const spec = {
            x_accessor: 'date',
            y_accessor: ['stage2', 'stage1', 'staging'],
            // legend: ['stage2', 'stage1', 'total'],
            right: 40,
            top: 20,
        };
        return (
            <div>
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="statspage.stage.header.results" defaultMessage="Stage tests" />
                        </h2>
                    </div>
                    <div className="widget__content">
                        <section className="wrapper__column">
                            <div className="column--4">
                                <ul className="list--stats--reduced">
                                    <li className="list__item--stats--reduced">
                                        <span className="text--label">
                                            <FormattedMessage id="statspage.stage.count.pos" defaultMessage="Number of participants HAT Stage Two" />
                                        </span>
                                        <span className="list__item__number--prominent">
                                            {total.stage2}
                                        </span>
                                    </li>
                                    <li className="list__item--stats--reduced">
                                        <span className="text--label">
                                            <FormattedMessage id="statspage.stage.count.neg" defaultMessage="Number of participants HAT Stage One" />
                                        </span>
                                        <span className="list__item__number--prominent">
                                            {total.stage1}
                                        </span>
                                    </li>
                                </ul>
                                <span className="text--explanation">
                                    <FormattedMessage
                                        id="statspage.stage.count.total"
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
                </div>
            </div>
        );
    }
}

StageWidget.propTypes = {
    timeseries: PropTypes.array.isRequired,
    total: PropTypes.object.isRequired,
};

const StageWidgetIntl = injectIntl(StageWidget);

export default StageWidgetIntl;
