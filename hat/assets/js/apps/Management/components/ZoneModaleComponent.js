import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import ZoneInfosComponent from './ZoneInfosComponent';

let timerSuccess;
let timerError;

class ZoneModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            zone: props.zone,
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
        newState.zone = nextProps.zone;
        if (nextProps.isUpdated) {
            newState.isUpdated = nextProps.isUpdated;
            newState.error = false;
            timerSuccess = setTimeout(() => {
                this.setState({
                    isUpdated: false,
                });
            }, 10000);
        }
        if (!deepEqual(nextProps.zone, this.props.zone, true)) {
            newState.zone = nextProps.zone;
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

    updateZoneField(key, value) {
        const newZone = Object.assign({}, this.state.zone, { [key]: value });
        this.props.updateCurrentZone(newZone);
        this.setState({
            isChanged: true,
        });
    }

    isSavedDisabled() {
        return (this.state.zone.name === '' ||
            !this.state.zone.name ||
            (!this.state.isChanged && this.state.zone.id !== 0));
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
            >
                <section className="edit-modal">
                    <ZoneInfosComponent
                        zone={this.state.zone}
                        updateZoneField={(key, value) => this.updateZoneField(key, value)}
                    />
                    {
                        this.state.isUpdated &&
                        <div className="align-right text--success">
                            <FormattedMessage id="main.label.zoneUpdated" defaultMessage="Health zone saved" />
                        </div>
                    }
                    {
                        this.state.error &&
                        <div className="align-right text--error">
                            <FormattedMessage id="main.label.error" defaultMessage="An error occured while saving" />
                        </div>
                    }
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.closeModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Close" />
                        </button>
                        <button
                            disabled={this.isSavedDisabled()}
                            className="button--save"
                            onClick={() => this.props.saveZone(this.state.zone)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveZone" defaultMessage="Save zone" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
ZoneModale.defaultProps = {
    zone: null,
    error: null,
};
ZoneModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    zone: PropTypes.object,
    saveZone: PropTypes.func.isRequired,
    updateCurrentZone: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    error: PropTypes.any,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ZoneModale);
