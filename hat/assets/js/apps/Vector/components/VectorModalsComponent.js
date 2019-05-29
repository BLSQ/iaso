import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';


import EditTrapComponent from './traps/EditTrapComponent';
import EditSiteComponent from './sites/EditSiteComponent';
import EditTargetComponent from './EditTargetComponent';
import CatchDetailComponent from './CatchDetailComponent';
import ShapeSelectionComponent from './ShapeSelectionComponent';

class VectorModalsComponent extends PureComponent {
    saveTrap(trap) {
        this.props.saveTrap(trap).then(() => {
            if (this.props.showModale.showSite) {
                this.props.getDetail(this.props.siteEdited.id, 'new_sites', 'showEditSiteModale');
            }
        });
    }

    render() {
        const {
            habitats,
            profiles,
            saveSite,
            saveTarget,
            shapeMarkers,
            showModale: {
                showCatch,
                showSite,
                showTrap,
                showTarget,
                showShapeSelection,
            },
            getDetail,
        } = this.props;
        return (
            <Fragment>
                {(showSite || showTrap || showTarget || showCatch) &&
                <div className="ReactModal__Overlay" />}
                {
                    showSite &&
                    <EditSiteComponent
                        showModale={showSite}
                        toggleModal={() => this.props.closeModal('showEditSiteModale', 'siteEdited')}
                        site={this.props.siteEdited}
                        saveSite={site => saveSite(site)}
                        profiles={profiles}
                        getDetail={(id, urlKey, key) => getDetail(id, urlKey, key)}
                        hidden={showTrap}
                    />
                }
                {
                    showTrap &&
                    <EditTrapComponent
                        showModale={showTrap}
                        toggleModal={() => this.props.closeModal('showEditTrapsModale', 'trapEdited')}
                        trap={this.props.trapEdited}
                        habitats={habitats}
                        saveTrap={trap => this.saveTrap(trap)}
                        getDetail={(id, urlKey, key) => getDetail(id, urlKey, key)}
                        hidden={showCatch}
                    />
                }
                {
                    showCatch &&
                    <CatchDetailComponent
                        showModale={showCatch}
                        toggleModal={() => this.props.closeModal('showEditCatchesModale', 'catchEdited')}
                        catch={this.props.catchEdited}
                        getDetail={(id, urlKey, key) => getDetail(id, urlKey, key)}
                    />
                }
                {
                    showTarget &&
                    <EditTargetComponent
                        showModale={showTarget}
                        toggleModal={() => this.props.closeModal('showEditTargetModale', 'targetEdited')}
                        target={this.props.targetEdited}
                        saveTarget={target => saveTarget(target)}
                    />
                }
                {
                    showShapeSelection &&
                    <ShapeSelectionComponent
                        showModale={showShapeSelection}
                        toggleModal={() => this.props.closeModal('showShapeSelectionModale', 'shapeMarkers')}
                        sites={shapeMarkers}
                        profiles={profiles}
                    />
                }
            </Fragment>
        );
    }
}

VectorModalsComponent.defaultProps = {
    siteEdited: null,
    trapEdited: null,
    targetEdited: null,
    catchEdited: null,
};

VectorModalsComponent.propTypes = {
    profiles: PropTypes.array.isRequired,
    habitats: PropTypes.array.isRequired,
    saveSite: PropTypes.func.isRequired,
    saveTrap: PropTypes.func.isRequired,
    saveTarget: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    showModale: PropTypes.object.isRequired,
    targetEdited: PropTypes.object,
    catchEdited: PropTypes.object,
    trapEdited: PropTypes.object,
    siteEdited: PropTypes.object,
    shapeMarkers: PropTypes.array.isRequired,
    getDetail: PropTypes.func.isRequired,
};

const MapDispatchToProps = () => ({});

const MapStateToProps = state => ({
    profiles: state.vectors.profiles,
    habitats: state.vectors.habitats,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(VectorModalsComponent));
