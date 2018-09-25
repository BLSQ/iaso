
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    injectIntl,
    defineMessages,
} from 'react-intl';
import ParticipationWidget from './widgets/ParticipationWidget';
import RegisteredWidget from './widgets/RegisteredWidget';
import ScreeningWidget from './widgets/ScreeningWidget';
import ConfirmationWidget from './widgets/ConfirmationWidget';
import StageWidget from './widgets/StageWidget';
import EvolutionWidgets from './widgets/EvolutionWidgets';


const MESSAGES = defineMessages({
    caseCount: {
        defaultMessage: 'Nombre de fiches',
        id: 'statspage.casecount.header.results',
    },
    unMatch: {
        defaultMessage: 'Nombre de cas positifs non localisés',
        id: 'statspage.unmatch.header.results',
    },
});

class Widgets extends Component {
    render() {
        const { formatMessage } = this.props.intl;
        const data = this.props.data || [];
        return (
            <div data-qa="stats-data-loaded">
                <ParticipationWidget coverage={data.coverage} timeseries={data.coverage.total_counts} />
                <ScreeningWidget total={data.positiveScreeningRate} />
                <EvolutionWidgets data={data.casecount} title={formatMessage(MESSAGES.caseCount)} />
                <EvolutionWidgets data={data.unmatch} title={formatMessage(MESSAGES.unMatch)} />
            </div>
        );
    }
}

const WidgetsWithIntl = injectIntl(Widgets);

Widgets.propTypes = {
    intl: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default WidgetsWithIntl;
