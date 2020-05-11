import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';

import { smallMapActions } from '../../../redux/smallMapReducer';

import ShapeMap from './ShapeMap';

import LayersComponent from '../../../components/LayersComponent';


class ShapeModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            isChanged: false,
            isUpdated: false,
            item: props.item,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isUpdated) {
            this.setState({
                isUpdated: false,
                isChanged: false,
            });
        }
    }

    updateItem(item) {
        this.setState({
            item,
            isChanged: true,
        });
    }

    render() {
        const {
            geoProvinces,
            geoZones,
            geoAreas,
            baseLayer,
            isLoadingShape,
        } = this.props;
        const { item } = this.state;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
            >
                <div className="widget__header">
                    {item.name}
                </div>
                <section className="edit-modal large extra-extra">
                    <section className="third-container small">
                        <div>
                            <div className="village-map-layers-container">
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => this.props.changeLayer(type, key)}
                                />
                            </div>
                        </div>
                        <div className="shape-map-container">
                            <ShapeMap
                                shapeItem={item}
                                baseLayer={baseLayer}
                                geoJson={{
                                    provinces: geoProvinces,
                                    zs: geoZones,
                                    as: geoAreas,
                                }}
                                isLoadingShape={isLoadingShape}
                                updateShape={newItem => this.updateItem(newItem)}
                            />
                        </div>
                    </section>
                    {
                        this.state.isUpdated
                        && (
                            <div className="align-right text--success">
                                <FormattedMessage id="main.label.shapeUpdated" defaultMessage="Shape saved" />
                            </div>
                        )
                    }
                    {
                        this.state.error
                        && (
                            <div className="align-right text--error">
                                <FormattedMessage id="main.label.error" defaultMessage="An error occured while saving" />
                            </div>
                        )
                    }
                    <div className="align-right">
                        {
                            item.geo_json
                            && (
                                <button
                                    className="button--delete margin-right"
                                    onClick={() => this.updateItem({
                                        ...item,
                                        geo_json: null,
                                        has_shape: false,
                                    })}
                                >
                                    <i className="fa fa-trash" />
                                    <FormattedMessage id="main.label.deleteShape" defaultMessage="Delete shape" />
                                </button>
                            )
                        }
                        <button
                            className="button"
                            onClick={() => this.props.closeModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Close" />
                        </button>
                        <button
                            disabled={!this.state.isChanged}
                            className="button--save"
                            onClick={() => this.props.saveShape(item)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="main.label.save" defaultMessage="Save" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
ShapeModale.defaultProps = {
    item: null,
};
ShapeModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    item: PropTypes.object,
    isUpdated: PropTypes.bool.isRequired,
    saveShape: PropTypes.func.isRequired,
    baseLayer: PropTypes.string.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    geoZones: PropTypes.object.isRequired,
    geoAreas: PropTypes.object.isRequired,
    changeLayer: PropTypes.func.isRequired,
    isLoadingShape: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    map: state.smallMap,
    baseLayer: state.smallMap.baseLayer,
    geoProvinces: state.smallMap.geoProvinces,
    geoZones: state.smallMap.geoZones,
    geoAreas: state.smallMap.geoAreas,
    isLoadingShape: state.smallMap.isLoadingShape,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    changeLayer: (type, key) => dispatch(smallMapActions.changeLayer(type, key)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ShapeModale);
