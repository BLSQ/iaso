import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';


import EditTrapComponent from './EditTrapComponent';
import EditSiteComponent from './sites/EditSiteComponent';
import ShowCatchesComponent from './ShowCatchesComponent';
import EditTargetComponent from './EditTargetComponent';
import CatchDetailComponent from './CatchDetailComponent';

class VectorModalesComponent extends PureComponent {
    saveTrap(trap, selectedValue) {
        const t = trap;
        t.is_selected = selectedValue;
        this.props.saveTrap(t);
    }

    render() {
        const {
            params,
            habitats,
            profiles,
            saveSite,
            saveTarget,
            saveTrap,
            showModale: {
                showCatch,
                showSite,
                showTrap,
                showTarget,
                showCatches,
            },
            getDetail,
        } = this.props;
        return (
            <Fragment>
                {(showCatches || showSite || showTrap || showTarget || showCatch) &&
                <div className="ReactModal__Overlay" />}

                {
                    showCatches &&
                    <ShowCatchesComponent
                        showModale={showCatches}
                        toggleModal={() => this.props.closeModal('showCatchesModale', 'trapEdited')}
                        trap={this.props.trapEdited}
                        params={params}
                        saveTrap={(trap, selectedValue) => this.saveTrap(trap, selectedValue)}
                    />
                }
                {
                    showSite &&
                    <EditSiteComponent
                        showModale={showSite}
                        toggleModal={() => this.props.closeModal('showEditSiteModale', 'siteEdited')}
                        site={this.props.siteEdited}
                        trapEdited={this.props.trapEdited}
                        saveSite={site => saveSite(site)}
                        saveTrap={(trap, selectedValue) => this.saveTrap(trap, selectedValue)}
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
                        saveTrap={site => saveTrap(site)}
                    />
                }
                {
                    showTarget &&
                    <EditTargetComponent
                        showModale={showTarget}
                        toggleModal={() => this.props.closeModal('showEditTargetModale', 'targetEdited')}
                        target={this.props.targetEdited}
                        profiles={profiles}
                        saveTarget={target => saveTarget(target)}
                    />
                }
                {
                    showCatch &&
                    <CatchDetailComponent
                        showModale={showCatch}
                        toggleModal={() => this.props.closeModal('showEditCatchesModale', 'catchEdited')}
                        catch={this.props.catchEdited}
                    />
                }
            </Fragment>
        );
    }
}

VectorModalesComponent.defaultProps = {
    siteEdited: null,
    trapEdited: null,
    targetEdited: null,
    catchEdited: null,
};

VectorModalesComponent.propTypes = {
    profiles: PropTypes.array.isRequired,
    habitats: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
    saveTrap: PropTypes.func.isRequired,
    saveTarget: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    showModale: PropTypes.object.isRequired,
    targetEdited: PropTypes.object,
    catchEdited: PropTypes.object,
    trapEdited: PropTypes.object,
    siteEdited: PropTypes.object,
    getDetail: PropTypes.func.isRequired,
};

const MapDispatchToProps = () => ({});

const MapStateToProps = state => ({
    profiles: state.vectors.profiles,
    habitats: state.vectors.habitats,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(VectorModalesComponent));
