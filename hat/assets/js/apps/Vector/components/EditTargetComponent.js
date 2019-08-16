import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';


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
        const { target } = this.state;
        const {
            saveTarget,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
                overlayClassName="transparent-overlay"
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.Target.title" defaultMessage="Target" />
                </div>
                <section className="edit-modal large">
                    <section>
                        <div>
                            <label
                                htmlFor={`name-${target.id}`}
                                className="filter__container__select__label"
                            >
                                UUID:
                            </label>
                            <span className="read-only">{target.uuid}</span>
                        </div>
                        <div>
                            <label
                                htmlFor={`name-${target.id}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.name"
                                    defaultMessage="Name"
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
                                    defaultMessage="River"
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
                                    id="main.label.ignore"
                                    defaultMessage="Ignore"
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
                                        id="main.label.yes"
                                        defaultMessage="Yes"
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
                                        id="main.label.no"
                                        defaultMessage="No"
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
                            <FormattedMessage id="main.label.close" defaultMessage="close" />
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
                            <FormattedMessage id="vector.label.savetarget" defaultMessage="Save target" />
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
    saveTarget: PropTypes.func.isRequired,
};

export default EditTargetComponent;
