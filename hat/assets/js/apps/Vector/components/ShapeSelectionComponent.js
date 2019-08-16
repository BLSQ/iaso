import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import moment from 'moment';

class ShapeSelectionComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps() {
        this.setState({
            isChanged: false,
        });
    }

    updateResponsible(value) {
        this.setState({
            responsibleId: value,
            isChanged: true,
        });
    }

    render() {
        const {
            profiles,
            sites,
            toggleModal,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.props.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.assignation.title" defaultMessage="Assignations" />
                </div>
                <section className="edit-modal large">
                    <section>
                        {
                            sites.length === 0 &&
                            <FormattedMessage id="vector.modale.assignation.label.noSites" defaultMessage="Aucun site sélectionné" />
                        }
                        {
                            sites.length > 0 &&
                            <Fragment>
                                <div>
                                    <table>
                                        <thead>
                                            <tr className="center">
                                                <th className="small">
                                                    <FormattedMessage id="main.label.name" defaultMessage="Name" />
                                                </th>
                                                <th className="small">
                                                    <FormattedMessage id="vector.modale.assignation.label.responsible" defaultMessage="Actual responsible" />
                                                </th>
                                                <th className="small">
                                                    <FormattedMessage id="vector.modale.assignation.label.updateDate" defaultMessage="Last update" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                sites.map(site => (
                                                    <tr key={site.id} className="center">
                                                        <td className="small">{site.name}</td>
                                                        <td className="small">{site.responsible}</td>
                                                        <td className="small">{moment(site.updated_at).format('DD/MM/YYYY HH:mm')}</td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <label
                                        htmlFor="responsibleId"
                                        className="filter__container__select__label"
                                    >
                                        <FormattedMessage
                                            id="main.label.responsible"
                                            defaultMessage="Responsable"
                                        />:
                                    </label>
                                    <Select
                                        clearable
                                        simpleValue
                                        id="responsibleId"
                                        name="responsibleId"
                                        value={this.state.responsibleId}
                                        placeholder="--"
                                        options={profiles.map(profile =>
                                            ({ label: profile.user__username, value: profile.id }))}
                                        onChange={value => this.updateResponsible(value)}
                                    />
                                </div>
                            </Fragment>
                        }
                    </section>

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        {
                            sites.length > 0 &&
                            <button
                                disabled={
                                    (!this.state.responsibleId ||
                                        !this.state.isChanged)
                                }
                                className="button--save"
                                onClick={() => this.props.saveAssignations(this.props.sites, this.state.responsibleId)}
                            >
                                <i className="fa fa-save" />
                                <FormattedMessage id="vector.label.saveAssignation" defaultMessage="Save assignations" />
                            </button>
                        }
                    </div>
                </section>
            </ReactModal>
        );
    }
}
ShapeSelectionComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    sites: PropTypes.array.isRequired,
    saveAssignations: PropTypes.func.isRequired,
};

export default ShapeSelectionComponent;
