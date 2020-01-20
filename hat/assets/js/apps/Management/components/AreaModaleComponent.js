import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import AreaInfosComponent from './AreaInfosComponent';

class AreaModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            area: props.area,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.area, this.props.area, true)) {
            this.setState(({
                area: nextProps.area,
            }));
        }
    }

    updateAreaField(key, value) {
        const newArea = {
            ...this.state.area,
            [key]: value,
        };
        if (key === 'ZS__province_id') {
            newArea.ZS_id = null;
        }
        this.props.updateCurrentArea(newArea);
        this.setState({
            isChanged: true,
        });
    }

    isSavedDisabled() {
        return (this.state.area.name === ''
            || !this.state.area.name
            || !this.state.area.source
            || this.state.area.source === ''
            || (!this.state.isChanged && this.state.area.id !== 0)
            || !this.state.area.ZS__province_id
            || !this.state.area.ZS_id);
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
            >
                <section className="edit-modal">
                    <AreaInfosComponent
                        area={this.state.area}
                        updateAreaField={(key, value) => this.updateAreaField(key, value)}
                    />
                    <div className="align-right padding-right">
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
                            onClick={() => this.props.saveArea(this.state.area)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveArea" defaultMessage="Save area" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
AreaModale.defaultProps = {
    area: null,
};
AreaModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    area: PropTypes.object,
    saveArea: PropTypes.func.isRequired,
    updateCurrentArea: PropTypes.func.isRequired,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default connect(MapStateToProps, MapDispatchToProps)(AreaModale);
