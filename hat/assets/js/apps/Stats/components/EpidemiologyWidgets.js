
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ParticipationWidget from './widgets/ParticipationWidget';
import ScreeningWidget from './widgets/ScreeningWidget';
import ConfirmationWidget from './widgets/ConfirmationWidget';

class EpidemiologyWidgets extends Component {
    render() {
        const data = this.props.data || [];
        return (
            <div data-qa="stats-data-loaded">
                <ParticipationWidget coverage={data.coverage} timeseries={data.coverage.total_counts} />
                <ScreeningWidget total={data.positiveScreeningRate} />
                <ConfirmationWidget total={data.confirmationsRate} />
            </div>
        );
    }
}


EpidemiologyWidgets.propTypes = {
    data: PropTypes.object.isRequired,
};

export default EpidemiologyWidgets;
