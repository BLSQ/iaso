
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import ReactModal from 'react-modal';
import isEqual from 'lodash/isEqual';
import {
    Grid,
} from '@material-ui/core';

import { casesActions } from '../redux/cases';

import CaseInfectionLocationComponent from './CaseInfectionLocationComponent';
import ModalItem from './ModalItemComponent';

const MESSAGES = {
    selectPlaceholder: {
        id: 'main.label.selectOption',
        defaultMessage: 'Select an option',
    },
    ambiguous: {
        id: 'main.cases.infectionLocation.ambiguous',
        defaultMessage: 'Amiguous place from version 2.0.45',
    },
    residence: {
        id: 'main.cases.infectionLocation.residence',
        defaultMessage: 'Residence place',
    },
    test: {
        id: 'main.cases.infectionLocation.test',
        defaultMessage: 'Test place',
    },
    other: {
        id: 'main.cases.infectionLocation.other',
        defaultMessage: 'Other',
    },
};

class CaseInfectionLocationModalComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentCase: props.currentCase,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(this.props.currentCase, nextProps.currentCase)) {
            this.setState({
                currentCase: nextProps.currentCase,
            });
        }
    }

    onChange(key, value) {
        this.setState({
            ...this.state,
            currentCase: {
                ...this.state.currentCase,
                [key]: value,
            },
        });
    }

    onSave() {
        const {
            currentCase,
        } = this.state;
        const {
            updateCase,
            patientId,
            toggleModal,
        } = this.props;

        updateCase(currentCase, patientId, toggleModal);
    }

    isSaveDisabled() {
        const {
            currentCase,
        } = this.state;
        const isUnTouched = isEqual(currentCase, this.props.currentCase);
        const isValid = (
            currentCase.infection_location
                ? Boolean(currentCase.infection_location.id)
                : Boolean(currentCase.infectionLocationVillageId)
                && Boolean(currentCase.infection_location_type)
        );
        return (isUnTouched || !isValid);
    }

    render() {
        const {
            toggleModal,
            showModale,
        } = this.props;
        const {
            currentCase,
        } = this.state;
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >
                <section className="medium-modal-content">
                    <div className="widget__header">
                        <FormattedMessage id="main.label.infectionLocationTitle" defaultMessage="Infection localisation" />
                        <span>&nbsp;</span>
                        <FormattedMessage
                            id="main.cases.edit.title"
                            defaultMessage="Case"
                        />
                        <span>&nbsp;</span>
                        {` ID: ${currentCase.id}`}
                    </div>
                    <Grid container spacing={0} className="margin-bottom">
                        <Grid
                            xs={12}
                            item
                            container
                            justify="flex-end"
                            alignContent="flex-start"
                        >
                            <ModalItem
                                labelComponent={(
                                    <FormattedMessage id="main.label.infectionLocation" defaultMessage="Infection location" />
                                )}
                                fieldComponent={(
                                    <Select
                                        multi={false}
                                        clearable
                                        simpleValue
                                        value={currentCase.infection_location_type}
                                        placeholder={formatMessage(MESSAGES.selectPlaceholder)}
                                        options={[
                                            {
                                                label: formatMessage(MESSAGES.ambiguous),
                                                value: 'ambiguous',
                                            },
                                            {
                                                label: formatMessage(MESSAGES.residence),
                                                value: 'residence',
                                            },
                                            {
                                                label: formatMessage(MESSAGES.test),
                                                value: 'test',
                                            },
                                            {
                                                label: formatMessage(MESSAGES.other),
                                                value: 'other',
                                            },
                                        ]}
                                        onChange={value => this.onChange('infection_location_type', value)}
                                    />
                                )}
                            />
                            <CaseInfectionLocationComponent
                                onChange={value => this.onChange('infectionLocationVillageId', value)}
                                currentCase={currentCase}
                            />
                        </Grid>
                    </Grid>
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

CaseInfectionLocationModalComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    currentCase: PropTypes.object.isRequired,
    updateCase: PropTypes.func.isRequired,
    patientId: PropTypes.number.isRequired,
    intl: PropTypes.object.isRequired,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    updateCase: (caseItem, patientId, toggleModal) => dispatch(casesActions.updateCase(dispatch, caseItem, patientId, toggleModal)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(CaseInfectionLocationModalComponent));
