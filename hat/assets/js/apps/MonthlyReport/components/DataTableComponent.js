import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    FormattedMessage,
    FormattedDate,
    injectIntl,
} from 'react-intl';
import Row from './RowComponent';
import VegaLiteVis from '../../../components/vega-lite-vis';
import VISUALIZATIONS from '../../../../json/visualizations.json';

class DataTableComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        // Minimum one day out, otherwise we'll get more participants
        // screened per day than we actually screened
        const daysOut = Math.max((new Date(this.props.data.meta.enddate) -
            new Date(this.props.data.meta.startdate)) / (1000 * 3600 * 24), 1);
        const dataCollectionPeriod =
            (this.props.data.meta.enddate && this.props.data.meta.startdate)
                ? (
                    <span>
                        <FormattedDate value={new Date(this.props.data.meta.startdate)} />
                        &nbsp;&mdash;&nbsp;
                        <FormattedDate value={new Date(this.props.data.meta.enddate)} />
                    </span>
                )
                : (
                    <span>
                        <FormattedMessage id="monthlyreport.label.unknown.date" defaultMessage="Unknown date" />
                        &nbsp;&mdash;&nbsp;
                        <FormattedMessage id="monthlyreport.label.unknown.date" defaultMessage="Unknown date" />
                    </span>
                );
        return (
            <div className="widget__container" data-qa="monthly-report-data-loaded">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="monthlyreport.header.results" defaultMessage="Monthly statistics from active screening using the HAT mobile application" />
                    </h2>
                </div>

                <section>
                    <h3 className="list__header block--margin-top--small">
                        <FormattedMessage id="monthlyreport.header.campaign_activity" defaultMessage="Campaign activity" />
                    </h3>
                    <ul className="list--stats">
                        <Row
                            className="list__item--stats--important list__item--stats--blue"
                            label={<FormattedMessage id="monthlyreport.items.villages_visited" defaultMessage="Villages visited" />}
                            value={String(this.props.data.meta.villages_visited)}
                        />

                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.as_visited" defaultMessage="Aires de Santé visited" />}
                            value={String(this.props.data.meta.as_visited)}
                        />
                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.tested" defaultMessage="Participants tested" />}
                            value={String(this.props.data.total.tested)}
                        />

                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.daily_screened" defaultMessage="Average number of participants screened per day" />}
                            definition={<FormattedMessage id="monthlyreport.items.daily_screened.definition" defaultMessage="Participants with a screening test" />}
                            value={String(Math.round(this.props.data.screening.total / daysOut))}
                        />

                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.date_range" defaultMessage="Data collection period" />}
                            definition={<FormattedMessage id="monthlyreport.items.date_range.definition" defaultMessage="Taken from date of first entry and date of last entry" />}
                            html={dataCollectionPeriod}
                        />

                        <div className="widget__content list__item--graph" data-qa="monthly-report-data-loaded">
                            <p>
                                <FormattedMessage id="monthlyreport.header.graphs" defaultMessage="Number of participants tested on each day" />
                            </p>
                            <VegaLiteVis
                                data={this.props.data.testedPerDay}
                                spec={VISUALIZATIONS.count_per_day.spec}
                            />
                        </div>

                    </ul>
                </section>

                <section>
                    <h3 className="list__header">
                        <FormattedMessage id="monthlyreport.header.cases" defaultMessage="Case information" />
                    </h3>
                    <ul className="list--stats">
                        <Row
                            className="list__item--stats--important list__item--stats--yellow"
                            label={<FormattedMessage id="monthlyreport.items.confirmedmissing" defaultMessage="Participants missing confirmation tests" />}
                            definition={<FormattedMessage id="monthlyreport.items.confirmedmissing.definition" defaultMessage="Participants with a positive screening test, but without a confirmation test" />}
                            value={String(this.props.data.screening.missing_confirmation)}
                        />

                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.confirmedpositive" defaultMessage="Confirmed cases" />}
                            definition={<FormattedMessage id="monthlyreport.items.confirmedpositive.definition" defaultMessage="Participants with a positive confirmation test" />}
                            value={String(this.props.data.confirmation.positive)}
                        />

                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.suspected" defaultMessage="Suspected cases" />}
                            definition={<FormattedMessage id="monthlyreport.items.suspected.definition" defaultMessage="Participants with a positive screening test" />}
                            value={String(this.props.data.screening.positive)}
                        />

                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.confirmednegative" defaultMessage="Negative cases" />}
                            definition={<FormattedMessage id="monthlyreport.items.confirmednegative.definition" defaultMessage="Participants with a negative confirmation test" />}
                            value={String(this.props.data.confirmation.negative)}
                        />
                    </ul>
                </section>

                <section>
                    <h3 className="list__header">
                        <FormattedMessage id="monthlyreport.header.tests" defaultMessage="Missing tests" />
                    </h3>
                    <ul className="list--stats">
                        <Row
                            className="list__item--stats"
                            label={<FormattedMessage id="monthlyreport.items.not_tested" defaultMessage="Participants missing test results" />}
                            definition={<FormattedMessage id="montlyreport.items.not_tested.definition" defaultMessage="Participants’ details registered but no test result was added" />}
                            value={String(this.props.data.total.registered -
                                    this.props.data.total.tested)}
                        />
                    </ul>
                </section>
            </div>
        );
    }
}
DataTableComponent.defaultProps = {
    data: {},
};

DataTableComponent.propTypes = {
    data: PropTypes.object,
};

const DataTableComponentIntl = injectIntl(DataTableComponent);

export default DataTableComponentIntl;
