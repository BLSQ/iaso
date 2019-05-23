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
        } = this.props;
        return (
            <Fragment>
                {
                    this.props.showCatchesModale &&
                    <ShowCatchesComponent
                        showModale={this.props.showCatchesModale}
                        toggleModal={() => this.props.toggleModal('showCatchesModale')}
                        trap={this.props.trapEdited}
                        params={params}
                        saveTrap={(trap, selectedValue) => this.saveTrap(trap, selectedValue)}
                    />
                }
                {
                    this.props.showEditSiteModale &&
                    <EditSiteComponent
                        showModale={this.props.showEditSiteModale}
                        toggleModal={() => this.props.toggleModal('showEditSiteModale')}
                        site={this.props.siteEdited}
                        trapEdited={this.props.trapEdited}
                        saveSite={site => saveSite(site)}
                        saveTrap={(trap, selectedValue) => this.saveTrap(trap, selectedValue)}
                        profiles={profiles}
                    />
                }
                {
                    this.props.showEditTrapsModale &&
                    <EditTrapComponent
                        showModale={this.props.showEditTrapsModale}
                        toggleModal={() => this.props.toggleModal('showEditTrapsModale')}
                        trap={this.props.trapEdited}
                        habitats={habitats}
                        saveTrap={site => saveTrap(site)}
                    />
                }
                {
                    this.props.showEditTargetModale &&
                    <EditTargetComponent
                        showModale={this.props.showEditTargetModale}
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
    showCatchesModale: PropTypes.bool.isRequired,
    showEditSiteModale: PropTypes.bool.isRequired,
    showEditTrapsModale: PropTypes.bool.isRequired,
    showEditTargetModale: PropTypes.bool.isRequired,
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
