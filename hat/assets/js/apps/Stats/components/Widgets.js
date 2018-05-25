
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ParticipationWidget from './widgets/ParticipationWidget';
import RegisteredWidget from './widgets/RegisteredWidget';
import ScreeningWidget from './widgets/ScreeningWidget';
import ConfirmationWidget from './widgets/ConfirmationWidget';
import StageWidget from './widgets/StageWidget';
import UnmatchCasesWidgets from './widgets/UnmatchCasesWidgets';


class Widgets extends Component {
    render() {
        const data = this.props.data || [];
        return (
            <div data-qa="stats-data-loaded">
                <UnmatchCasesWidgets data={data.unmatch} />
                <ParticipationWidget coverage={data.coverage} />
                <RegisteredWidget timeseries={data.timeseries} total={data.total} />
                <ScreeningWidget timeseries={data.timeseries} total={data.screening} />
                <ConfirmationWidget timeseries={data.timeseries} total={data.confirmation} />
                <StageWidget timeseries={data.timeseries} total={data.staging} />
            </div>
        );
    }
}


Widgets.propTypes = {
    data: PropTypes.object.isRequired,
};

export default Widgets;
