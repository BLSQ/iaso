import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import { connect } from 'react-redux';

import TabsComponent from '../../../../components/TabsComponent';
import CustomTableComponent from '../../../../components/CustomTableComponent';
import TrapInfos from './TrapInfos';
import catchesColumns from '../../utlls/catchesColumns';
import { getRequest } from '../../../../utils/fetchData';
import { mapActions } from '../../redux/mapReducer';
import LayersComponent from '../../../../components/LayersComponent';
import CatchesMap from './CatchesMap';


const LOCAL_MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Infos',
        id: 'vector.labels.infos',
    },
    catches: {
        defaultMessage: 'Liste des déploiements',
        id: 'vector.labels.catches',
    },
    map: {
        defaultMessage: 'Carte',
        id: 'vector.labels.map',
    },
});
class EditTrapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            trap: props.trap,
            isChanged: false,
            currentTab: 'infos',
            catchesColumns: catchesColumns(
                props.intl.formatMessage,
                (id, urlKey, key) => {
                    props.getDetail(id, urlKey, key);
                },
            ),
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            trap: nextProps.trap,
            isChanged: false,
        });
    }

    updateTrapField(key, value) {
        const newTrap = Object.assign({}, this.state.trap, { [key]: value });
        this.setState({
            trap: newTrap,
            isChanged: true,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        const { trap } = this.state;
        const {
            habitats,
            saveTrap,
            hidden,
            map: {
                baseCatchLayer,
            },
            getDetail,
            changeLayer,
        } = this.props;
        const { currentTab } = this.state;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
                overlayClassName="transparent-overlay"
                className={hidden ? 'hidden-modal' : ''}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.trap.title" defaultMessage="Piège" />:
                    {' '}{trap.name}
                </div>
                <section className="edit-modal large extra-extra">
                    <div className="tabs-relative">
                        <TabsComponent
                            isRedirecting={false}
                            selectTab={key => (this.setState({ currentTab: key }))}
                            tabs={[
                                { label: formatMessage(LOCAL_MESSAGES.infos), key: 'infos' },
                                { label: formatMessage(LOCAL_MESSAGES.map), key: 'map' },
                                { label: formatMessage(LOCAL_MESSAGES.catches), key: 'catches' },
                            ]}
                            defaultSelect={currentTab}
                            currentTab={currentTab}
                        />
                    </div>
                    <div className="padding bordered round">
                        {
                            currentTab === 'infos' &&
                            <TrapInfos
                                trap={trap}
                                toggleModal={() => this.props.toggleModal()}
                                habitats={habitats}
                                updateTrapField={(key, value) => this.updateTrapField(key, value)}
                                getDetail={(id, urlKey, key) => getDetail(id, urlKey, key)}
                            />
                        }
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
                                            <i className="map__option__icon--catches small" />
                                            <FormattedMessage id="vector.modale.catches.legend.catches" defaultMessage="Déploiements" />
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="catches-map-container">
                                <CatchesMap
                                    baseLayer={baseCatchLayer}
                                    trap={trap}
                                    habitatsList={habitats}
                                    getShape={type => this.props.getShape(type)}
                                    saveTrap={this.props.saveTrap}
                                    getDetail={(id, urlKey, key) => getDetail(id, urlKey, key)}
                                />
                            </div>
                        </div>
                        {
                            currentTab === 'catches' &&
                            <div>
                                <CustomTableComponent
                                    isSortable={false}
                                    showPagination={false}
                                    columns={this.state.catchesColumns}
                                    defaultSorted={[{ id: 'collect_date', desc: false }]}
                                    params={{}}
                                    onRowClicked={() => { }}
                                    multiSort={false}
                                    reduxPage={{
                                        list: trap.catches,
                                        params: {},
                                    }}
                                    fetchDatas={false}
                                    defaultPath="map"
                                    canSelect={false}
                                    pageSize={100}
                                    disableHeaderFixed
                                />
                            </div>
                        }
                    </div>

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        <button
                            disabled={
                                (trap.name === '' ||
                                    !this.state.isChanged)
                            }
                            className="button--save"
                            onClick={() => saveTrap(trap)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="vector.label.savetrap" defaultMessage="Sauvegarder le piège" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
EditTrapComponent.defaultProps = {
    trap: undefined,
};

EditTrapComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    trap: PropTypes.object,
    intl: PropTypes.object.isRequired,
    habitats: PropTypes.array.isRequired,
    saveTrap: PropTypes.func.isRequired,
    getDetail: PropTypes.func.isRequired,
    hidden: PropTypes.bool.isRequired,
    map: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    getShape: url => getRequest(url, dispatch, null, false),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key, true)),
});

const MapStateToProps = state => ({
    map: state.map,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(EditTrapComponent));
