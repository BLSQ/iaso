import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'vector.labels.none',
    },
});
class EditTargetComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            target: props.target,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            target: nextProps.target,
            isChanged: false,
        });
    }

    updateTargetField(key, value) {
        const newTarget = Object.assign({}, this.state.target, { [key]: value });
        this.setState({
            target: newTarget,
            isChanged: true,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        const { target } = this.state;
        const {
            profiles,
            saveTarget,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal large">
                    <section>
                        <div>
                            <label
                                htmlFor={`name-${target.id}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.name"
                                    defaultMessage="Nom"
                                />:
                            </label>
                            <input
                                type="text"
                                name="name"
                                id={`name-${target.id}`}
                                className={(!target.name || target.name === '') ? 'form-error' : ''}
                                value={target.name}
                                onChange={event => this.updateTargetField('name', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor={`river-${target.id}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.river"
                                    defaultMessage="Rivière"
                                />:
                            </label>
                            <input
                                type="text"
                                name="river"
                                id={`river-${target.id}`}
                                value={target.river ? target.river : ''}
                                onChange={event => this.updateTargetField('river', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="verctor.label.ignore"
                                    defaultMessage="Ignorer"
                                />:
                            </label>
                            <section className="check-box-container">
                                <input
                                    id={`ignore-${target.id}`}
                                    type="radio"
                                    name="ignore"
                                    checked={target.ignore ? 'checked' : ''}
                                    value={target.ignore}
                                    onChange={() => this.updateTargetField('ignore', true)}
                                />
                                <label
                                    htmlFor={`ignore-${target.id}`}
                                    className="checkbox-label"
                                >
                                    <FormattedMessage
                                        id="verctor.label.yes"
                                        defaultMessage="Oui"
                                    />
                                </label>
                                <input
                                    id={`ignore-${target.id}-false`}
                                    type="radio"
                                    name="ignore"
                                    checked={!target.ignore ? 'checked' : ''}
                                    value={target.ignore}
                                    onChange={() => this.updateTargetField('ignore', false)}
                                />
                                <label
                                    htmlFor={`ignore-${target.id}-false`}
                                    className="checkbox-label"
                                >
                                    <FormattedMessage
                                        id="verctor.label.no"
                                        defaultMessage="Non"
                                    />
                                </label>
                            </section>
                        </div>
                    </section>

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
                                (target.name === '' ||
                                    !this.state.isChanged)
                            }
                            className="button--save"
                            onClick={() => saveTarget(target)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="vector.label.savetarget" defaultMessage="Sauvegarder l'écran" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
EditTargetComponent.defaultProps = {
    target: {
        id: 0,
        name: '',
    },
};
EditTargetComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    target: PropTypes.object,
    intl: PropTypes.object.isRequired,
    profiles: PropTypes.array.isRequired,
    saveTarget: PropTypes.func.isRequired,
};

export default injectIntl(EditTargetComponent);
