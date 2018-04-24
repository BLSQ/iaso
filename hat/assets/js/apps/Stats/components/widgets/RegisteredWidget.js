import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Visualization from '../Visualization';

class RegisteredWidget extends Component {
    render() {
        const { timeseries, total } = this.props;
        const percentageMissing = total.tested
            ? `${Math.round((total.registered - total.tested) / (total.registered * 10000)) / 100}%`
            : <FormattedMessage id="statspage.none" defaultMessage="none" />;
        const spec = {
            x_accessor: 'date',
            y_accessor: 'registered_total',
            right: 40,
            top: 20,
        };
        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="statspage.registered.header.results" defaultMessage="Amount of people missing tests" />
                    </h2>
                </div>
                <div className="widget__content">
                    <section className="wrapper__column">
                        <div className="column--4">
                            <h2 className="block--margin-bottom--xs">
                                {percentageMissing}
                                &nbsp;
                                <FormattedMessage id="statspage.registered.subheader" defaultMessage="missing tests" />
                            </h2>
                            <p>
                                <FormattedMessage id="statspage.registered.description" defaultMessage="The percentage of participants registered in the app who are missing test results" />
                            </p>
                            <ul className="list--stats--reduced">
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.registered.count.tested" defaultMessage="Number of participants with a test result" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.tested}
                                    </span>
                                </li>
                                <li className="list__item--stats--reduced">
                                    <span className="text--label">
                                        <FormattedMessage id="statspage.registered.count.registered" defaultMessage="Number of participants registered" />
                                    </span>
                                    <span className="list__item__number--prominent">
                                        {total.registered}
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="column--6 container__graph--6">
                            <Visualization data={timeseries} spec={spec} />
                        </div>
                    </section>
                </div>
            </div>);
    }
}

RegisteredWidget.propTypes = {
    timeseries: PropTypes.array.isRequired,
    total: PropTypes.object.isRequired,
};

const RegisteredWidgetIntl = injectIntl(RegisteredWidget);

export default RegisteredWidgetIntl;
