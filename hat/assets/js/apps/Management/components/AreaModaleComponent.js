import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import AreaInfosComponent from './AreaInfosComponent';

let timerSuccess;
let timerError;

class AreaModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            area: props.area,
            isChanged: false,
            isUpdated: false,
            error: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        let newState = {};
        newState.area = nextProps.area;
        if (nextProps.isUpdated) {
            newState.isUpdated = nextProps.isUpdated;
            newState.error = false;
            timerSuccess = setTimeout(() => {
                this.setState({
                    isUpdated: false,
                });
            }, 10000);
        }
        if (!deepEqual(nextProps.area, this.props.area, true)) {
            newState.area = nextProps.area;
        } else if (nextProps.error) {
            newState = {
                error: nextProps.error,
                isUpdated: false,
                isChanged: true,
            };
            timerError = setTimeout(() => {
                this.setState({
                    error: false,
                });
            }, 10000);
        }
        this.setState(newState);
    }

    componentWillUnmount() {
        if (timerSuccess) {
            clearTimeout(timerSuccess);
        }
        if (timerError) {
            clearTimeout(timerError);
        }
    }

    updateAreaField(key, value) {
        const newArea = Object.assign({}, this.state.area, { [key]: value });
        this.props.updateCurrentArea(newArea);
        this.setState({
            isChanged: true,
        });
    }

    isSavedDisabled() {
        return (this.state.area.name === '' ||
            !this.state.area.name ||
            (!this.state.isChanged && this.state.area.id !== 0));
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
            >
                <section className="edit-modal large extra">
                    <AreaInfosComponent
                        area={this.state.area}
                        updateAreaField={(key, value) => this.updateAreaField(key, value)}
                    />
                    {
                        this.state.isUpdated &&
                        <div className="align-right text--success">
                            <FormattedMessage id="main.label.villageUpdated" defaultMessage="Village sauvegardé" />
                        </div>
                    }
                    {
                        this.state.error &&
                        <div className="align-right text--error">
                            <FormattedMessage id="main.label.error" defaultMessage="Une erreur est survenue lors de la sauvegarde" />
                        </div>
                    }
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.closeModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        <button
                            disabled={this.isSavedDisabled()}
                            className="button--save"
                            onClick={() => this.props.saveArea(this.state.area)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveArea" defaultMessage="Sauvegarder l'aire" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
AreaModale.defaultProps = {
    area: null,
    error: null,
};
AreaModale.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    area: PropTypes.object,
    saveArea: PropTypes.func.isRequired,
    updateCurrentArea: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    error: PropTypes.any,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default connect(MapStateToProps, MapDispatchToProps)(AreaModale);
