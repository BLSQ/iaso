import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { createUrl } from '../../../utils/fetchData';
import { deepEqual } from '../../../utils';
import ZoneInfosComponent from './ZoneInfosComponent';

class ZoneModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            zone: props.zone,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.zone, this.props.zone, true)) {
            this.setState(({
                zone: nextProps.zone,
            }));
        }
    }

    updateZoneField(key, value) {
        const newZone = {
            ...this.state.zone,
            [key]: value,
        };
        this.props.updateCurrentZone(newZone);
        this.setState({
            isChanged: true,
        });
    }

    isSavedDisabled() {
        return (this.state.zone.name === ''
            || !this.state.zone.name
            || !this.state.zone.source
            || this.state.zone.source === ''
            || (!this.state.isChanged && this.state.zone.id !== 0)
            || !this.state.zone.province_id);
    }

    render() {
        const {
            geoProvinces,
        } = this.props;
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
                        geoProvinces={geoProvinces}
                    />
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
};
ZoneModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    zone: PropTypes.object,
    saveZone: PropTypes.func.isRequired,
    updateCurrentZone: PropTypes.func.isRequired,
    geoProvinces: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    geoProvinces: state.smallMap.geoProvinces,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ZoneModale);
