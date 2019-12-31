
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import { casesActions } from '../redux/cases';
import { filterActions } from '../../../redux/filtersRedux';

import CaseInfosComponent from './CaseInfosComponent';


class CaseModalComponent extends Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        console.log(props.currentCase);
        this.state = {
            currentCase: props.currentCase,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
        if (this.props.teams.length === 0) {
            this.props.fetchTeams();
        }
        if (this.props.devices.length === 0) {
            this.props.fetchDevices();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(this.props.currentCase, nextProps.currentCase)) {
            this.setState({
                currentCase: nextProps.currentCase,
            });
        }
    }

    onChange(key, value, subKey, subSubKey) {
        this.setState({
            ...this.state,
            currentCase: {
                ...this.state.currentCase,
                [key]: !subKey ? value : {
                    ...this.state.currentCase[key],
                    [subKey]: !subSubKey ? value : {
                        ...this.state.currentCase[key][[subKey]],
                        [subSubKey]: value,
                    },
                },
            },
        });
    }

    onSave() {
        const {
            currentCase,
        } = this.state;
        const {
            updateCase,
            createCase,
            patientId,
            toggleModal,
        } = this.props;
        if (currentCase.id !== 0) {
            updateCase(currentCase, patientId, toggleModal);
        } else {
            createCase(currentCase, patientId, toggleModal);
        }
    }

    isSaveDisabled() {
        const {
            currentCase,
        } = this.state;
        const isNewCase = currentCase.id === 0;
        const isUnTouched = isEqual(currentCase, this.props.currentCase);
        const isValid = (
            Boolean(currentCase.screening_type)
        );
        return ((!isNewCase && isUnTouched) || !isValid);
    }

    render() {
        const {
            toggleModal,
            showModale,
        } = this.props;
        const {
            currentCase,
        } = this.state;
        const isNewCase = currentCase.id === 0;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >

                <section className="large-modal-content">
                    <div className="widget__header">
                        {
                            !isNewCase
                            && (
                                <Fragment>
                                    <FormattedMessage
                                        id="main.cases.edit.title"
                                        defaultMessage="Case"
                                    />
                                    <span>{' '}</span>
                                    {` ID: ${currentCase.id}`}
                                </Fragment>
                            )
                        }
                        {
                            isNewCase
                            && (
                                <FormattedMessage
                                    id="main.cases.add"
                                    defaultMessage="Add a case"
                                />
                            )
                        }
                    </div>
                    <section className="margin-bottom">
                        <CaseInfosComponent
                            currentCase={currentCase}
                            onChange={(key, value, subKey, subSubKey) => this.onChange(key, value, subKey, subSubKey)}
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

CaseModalComponent.defaultProps = {
    currentCase: {
        id: 0,
        team: {
            normalized_team: {},
        },
    },
};

CaseModalComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    currentCase: PropTypes.object,
    updateCase: PropTypes.func.isRequired,
    createCase: PropTypes.func.isRequired,
    patientId: PropTypes.number.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    teams: PropTypes.array.isRequired,
    fetchDevices: PropTypes.func.isRequired,
    devices: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
    teams: state.patientsFilters.teams,
    devices: state.patientsFilters.devices,
    testLocationFilters: state.testLocationFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchDevices: () => dispatch(filterActions.fetchDevices(dispatch)),
    updateCase: (caseItem, patientId, toggleModal) => dispatch(casesActions.updateCase(dispatch, caseItem, patientId, toggleModal)),
    createCase: (caseItem, patientId, toggleModal) => dispatch(casesActions.createCase(dispatch, caseItem, patientId, toggleModal)),
});


export default connect(MapStateToProps, MapDispatchToProps)(CaseModalComponent);
