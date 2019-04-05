import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import LayersComponent from '../../../components/LayersComponent';
import CatchesMap from './CatchesMap';
import { getRequest } from '../../../utils/fetchData';
import { mapActions } from '../redux/mapReducer';
import TabsComponent from '../../../components/TabsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import catchesColumns from '../utlls/catchesColumns';

const MESSAGES = defineMessages({
    map: {
        defaultMessage: 'Carte',
        id: 'vector.catches.map',
    },
    list: {
        defaultMessage: 'Liste',
        id: 'vector.catches.list',
    },
});
class ShowCatchesComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            trap: props.trap,
            currentTab: 'map',
            catchesColumns: catchesColumns(props.intl.formatMessage, MESSAGES),
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            trap: nextProps.trap,
        });
    }


    render() {
        const {
            trap,
            currentTab,
        } = this.state;
        const {
            params,
            map: {
                baseCatchLayer,
            },
            changeLayer,
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.catches.title" defaultMessage="Déploiements sur le piège" />:
                    {' '}{trap.name}
                </div>
                <section className="edit-modal large extra">
                    <TabsComponent
                        selectTab={key => (this.setState({ currentTab: key }))}
                        isRedirecting={false}
                        currentTab={currentTab}
                        tabs={[
                            { label: formatMessage(MESSAGES.map), key: 'map' },
                            { label: formatMessage(MESSAGES.list), key: 'list' },
                        ]}
                        defaultSelect={currentTab}
                    />
                    <div className={`${currentTab !== 'map' ? 'hidden-opacity' : ''} third-container small-filters`} >
                        <div>
                            <LayersComponent
                                base={baseCatchLayer}
                                change={(type, key) => changeLayer(type, key)}
                            />
                            <div className="map__option padding-top">
                                <span className="map__option__header">
                                    <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                </span>
                                <ul className="map__option__list legend">
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--site" />
                                        <FormattedMessage id="vector.modale.catches.legend.trap" defaultMessage="Piège" />
                                    </li>
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--catches" />
                                        <FormattedMessage id="vector.modale.catches.legend.catches" defaultMessage="Déploiements" />
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="catches-map-container">
                            <CatchesMap
                                baseLayer={baseCatchLayer}
                                trap={trap}
                                getShape={type => this.props.getShape(type)}
                                saveTrap={this.props.saveTrap}
                            />
                        </div>
                    </div>
                    {
                        currentTab === 'list' &&
                        <section>
                            <CustomTableComponent
                                isSortable={false}
                                showPagination={false}
                                columns={this.state.catchesColumns}
                                defaultSorted={[{ id: 'collect_date', desc: false }]}
                                params={params}
                                onRowClicked={() => { }}
                                multiSort={false}
                                reduxPage={{
                                    list: trap.catches,
                                }}
                                fetchDatas={false}
                                defaultPath="map"
                                canSelect={false}
                                pageSize={100}
                                disableHeaderFixed
                            />
                        </section>
                    }

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
ShowCatchesComponent.defaultProps = {
    trap: {},
};
ShowCatchesComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    trap: PropTypes.object,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    saveTrap: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    getShape: url => getRequest(url, dispatch, null, false),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key, true)),
});

const MapStateToProps = state => ({
    map: state.map,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(ShowCatchesComponent));
