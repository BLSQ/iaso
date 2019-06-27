import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { deepEqual } from '../../../utils';


let timerSuccess;
let timerError;

class ShapeModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
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
        newState.item = nextProps.item;
        if (nextProps.isUpdated) {
            newState.isUpdated = nextProps.isUpdated;
            newState.error = false;
            timerSuccess = setTimeout(() => {
                this.setState({
                    isUpdated: false,
                });
            }, 10000);
        }
        if (!deepEqual(nextProps.item, this.props.item, true)) {
            newState.item = nextProps.item;
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

    render() {
        console.log(this.props.item);
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
            >
                <section className="edit-modal large extra">
                    CARTE
                    {
                        this.state.isUpdated &&
                        <div className="align-right text--success">
                            <FormattedMessage id="main.label.shapeUpdated" defaultMessage="Surface sauvegardée" />
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
                            disabled={!this.state.isChanged}
                            className="button--save"
                            onClick={() => this.props.saveShape()}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.save" defaultMessage="Sauvegarder" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
ShapeModale.defaultProps = {
    item: null,
    error: null,
};
ShapeModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    item: PropTypes.object,
    isUpdated: PropTypes.bool.isRequired,
    error: PropTypes.any,
    saveShape: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    geoFiltersModale: state.geoFiltersModale,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(ShapeModale);
