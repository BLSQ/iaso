
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';


export class TeamSelection extends Component {
    constructor(props) {
        super(props)
        this.state = {
            currentPlanning: null,
            plannings: []
        }
    }

    componentWillReceiveProps(newProps) {
        const { data, error, loading } = newProps.load;
        const plannings = ((data && data.plannings) || []);
        let currentPlanning = null;
        if (!this.state.currentPlanning && plannings.length > 0) {
            console.log(plannings[0]);
            currentPlanning = plannings[0].id;
        }
        this.setState({
            plannings,
            currentPlanning
        })
    }

    render() {
        const { data, error, loading } = this.props.load;
        if (loading || typeof loading === 'undefined' ){
            return false;
        }
        return (
            <div className="widget__container">
                <Select
                    simpleValue
                    autosize={false}
                    disabled={loading}
                    name='plannings'
                    value={this.state.currentPlanning}
                    placeholder={'Plannings'}
                    options={this.state.plannings.map((planning) => ({
                        label: planning.name, value: planning.id
                    }))}
                    onChange={planning =>  this.setState({currentPlanning: planning})}
                />
            </div>
        )
    }
}

const TeamSelectionWithIntl = injectIntl(TeamSelection);

TeamSelection.propTypes = {
    redirect: PropTypes.func.isRequired
};

const MapDispatchToProps = dispatch => ({
    redirect: params => dispatch(push(createUrl(params)))
});

const MapStateToProps = state => ({
    load: state.load
});


export default connect(MapStateToProps, MapDispatchToProps)(TeamSelectionWithIntl);
