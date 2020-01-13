
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import isEqual from 'lodash/isEqual';
import {
    Grid,
} from '@material-ui/core';

import { casesActions } from '../redux/cases';

import CaseLocationComponent from './CaseLocationComponent';


class CaseLocationModalComponent extends Component {
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
            Boolean(currentCase.villageId)
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
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >

                <section className="medium-modal-content">
                    <div className="widget__header">
                        <FormattedMessage id="main.label.location" defaultMessage="Localisation" />
                        <span>&nbsp;</span>
                        <FormattedMessage
                            id="main.cases.edit.title"
                            defaultMessage="Case"
                        />
                        <span>&nbsp;</span>
                        {` ID: ${currentCase.id}`}
                    </div>
                    <section className="margin-bottom">
                        <CaseLocationComponent
                            onChange={value => this.onChange('villageId', value)}
                            currentCase={currentCase}
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

CaseLocationModalComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    currentCase: PropTypes.object.isRequired,
    updateCase: PropTypes.func.isRequired,
    patientId: PropTypes.number.isRequired,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    updateCase: (caseItem, patientId, toggleModal) => dispatch(casesActions.updateCase(dispatch, caseItem, patientId, toggleModal)),
});


export default connect(MapStateToProps, MapDispatchToProps)(CaseLocationModalComponent);
