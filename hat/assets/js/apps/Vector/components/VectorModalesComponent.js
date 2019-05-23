import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';


import EditTrapComponent from './EditTrapComponent';
import EditSiteComponent from './sites/EditSiteComponent';
import ShowCatchesComponent from './ShowCatchesComponent';
import EditTargetComponent from './EditTargetComponent';

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
            },
        } = this.props;
        return (
            <Fragment>
                {
                    showCatch &&
                    <ShowCatchesComponent
                        showModale={showCatch}
                        toggleModal={() => this.props.toggleModal('showCatchesModale')}
                        trap={this.props.trapEdited}
                        params={params}
                        saveTrap={(trap, selectedValue) => this.saveTrap(trap, selectedValue)}
                    />
                }
                {
                    showSite &&
                    <EditSiteComponent
                        showModale={showSite}
                        toggleModal={() => this.props.toggleModal('showEditSiteModale')}
                        site={this.props.siteEdited}
                        trapEdited={this.props.trapEdited}
                        saveSite={site => saveSite(site)}
                        saveTrap={(trap, selectedValue) => this.saveTrap(trap, selectedValue)}
                        profiles={profiles}
                    />
                }
                {
                    showTrap &&
                    <EditTrapComponent
                        showModale={showTrap}
                        toggleModal={() => this.props.toggleModal('showEditTrapsModale')}
                        trap={this.props.trapEdited}
                        habitats={habitats}
                        saveTrap={site => saveTrap(site)}
                    />
                }
                {
                    showTarget &&
                    <EditTargetComponent
                        showModale={showTarget}
                        toggleModal={() => this.props.toggleModal('showEditTargetModale')}
                        target={this.props.targetEdited}
                        profiles={profiles}
                        saveTarget={target => saveTarget(target)}
                    />
                }
            </Fragment>
        );
    }
}

VectorModalesComponent.propTypes = {
    profiles: PropTypes.array.isRequired,
    habitats: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
    saveTrap: PropTypes.func.isRequired,
    saveTarget: PropTypes.func.isRequired,
    toggleModal: PropTypes.func.isRequired,
    showModale: PropTypes.object.isRequired,
    targetEdited: PropTypes.object.isRequired,
    trapEdited: PropTypes.object.isRequired,
    siteEdited: PropTypes.object.isRequired,
};

const MapDispatchToProps = () => ({});

const MapStateToProps = state => ({
    profiles: state.vectors.profiles,
    habitats: state.vectors.habitats,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(VectorModalesComponent));
