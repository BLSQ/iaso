
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import isEqual from 'lodash/isEqual';
import {
    Grid,
} from '@material-ui/core';
import {
    updateTreatment,
    createTreatment,
} from '../requests';
import { filterActions } from '../../../redux/filtersRedux';

import TreatmentInfosComponent from './TreatmentInfosComponent';


class TreatmentModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTreatment: props.currentTreatment,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
        if (this.props.devices.length === 0) {
            this.props.fetchDevices();
        }
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(this.props.currentTreatment, prevProps.currentTreatment)) {
            this.updateTreatment(prevProps.currentTreatment);
        }
    }

    onChange(key, value) {
        const {
            currentTreatment,
        } = this.state;
        const newState = {
            ...this.state,
            currentTreatment: {
                ...currentTreatment,
                [key]: value,
            },
        };
        if (key === 'dead') {
            newState.currentTreatment.death_moment = null;
        }
        if (key === 'complete') {
            newState.currentTreatment.incomplete_reasons = null;
            newState.currentTreatment.end_date = null;
        }
        if (key === 'incomplete_reasons' || key === 'issues') {
            newState.currentTreatment[key] = newState.currentTreatment[key].split(',');
        }
        this.setState(newState);
    }

    onSave() {
        const {
            currentTreatment,
        } = this.state;
        const {
            patientId,
            toggleModal,
            dispatch,
        } = this.props;

        if (currentTreatment.id !== 0) {
            updateTreatment(dispatch, currentTreatment, patientId, toggleModal);
        } else {
            createTreatment(dispatch, currentTreatment, patientId, toggleModal);
        }
    }

    updateTreatment(currentTreatment) {
        this.setState({
            currentTreatment,
        });
    }


    isSaveDisabled() {
        const {
            currentTreatment,
        } = this.state;
        const isNew = currentTreatment.id === 0;
        const isUnTouched = isEqual(currentTreatment, this.props.currentTreatment);
        const isValid = (
            Boolean(currentTreatment.medicine)
            && Boolean(currentTreatment.start_date)
            && (
                (currentTreatment.complete && Boolean(currentTreatment.end_date))
                || (currentTreatment.complete === false && currentTreatment.incomplete_reasons && currentTreatment.incomplete_reasons.length > 0)
                || (!currentTreatment.complete && currentTreatment.complete !== false)
            )
            && (
                Boolean(currentTreatment.dead && currentTreatment.death_moment)
                || !currentTreatment.dead
            )
        );
        return ((!isNew && isUnTouched) || !isValid);
    }

    render() {
        const {
            toggleModal,
            showModale,
        } = this.props;
        const {
            currentTreatment,
        } = this.state;
        const isNew = currentTreatment.id === 0;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >

                <section className="medium-modal-content">
                    <div className="widget__header">
                        {
                            !isNew
                            && (
                                <Fragment>
                                    <FormattedMessage
                                        id="management.detail.treatment"
                                        defaultMessage="Treatment"
                                    />
                                    <span className="inline-block margin-left--tiny--tiny"> ID:</span>
                                    <span className="inline-block margin-left--tiny--tiny">{currentTreatment.id}</span>
                                </Fragment>
                            )
                        }
                        {
                            isNew
                            && (
                                <FormattedMessage
                                    id="patient.treatment.add"
                                    defaultMessage="Add a treatment"
                                />
                            )
                        }
                    </div>
                    <section className="margin-bottom">
                        <TreatmentInfosComponent
                            currentTreatment={currentTreatment}
                            onChange={(key, value) => this.onChange(key, value)}
                        />
                    </section>
                    <Grid container spacing={2}>
                        <Grid
                            xs={12}
                            item
                            container
                            justify="flex-end"
                        >
                            <button
                                className="button margin-right"
                                onClick={() => this.props.toggleModal()}
                            >
                                <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                            </button>
                            <button
                                disabled={this.isSaveDisabled()}
                                className="button"
                                onClick={() => this.onSave()}
                            >
                                <i className="fa fa-save" />
                                <FormattedMessage id="main.label.save" defaultMessage="Save" />
                            </button>
                        </Grid>
                    </Grid>
                </section>
            </ReactModal>
        );
    }
}


TreatmentModal.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    currentTreatment: PropTypes.object.isRequired,
    patientId: PropTypes.number.isRequired,
    devices: PropTypes.array.isRequired,
    fetchDevices: PropTypes.func.isRequired,
};


const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchDevices: () => dispatch(filterActions.fetchDevices(dispatch)),
});

const MapStateToProps = state => ({
    devices: state.patientsFilters.devices,
});

export default connect(MapStateToProps, MapDispatchToProps)(TreatmentModal);
