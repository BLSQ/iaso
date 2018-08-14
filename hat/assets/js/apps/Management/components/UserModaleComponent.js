import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';


class UserModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            user: props.user,
            password: '',
            isChanged: false,
        };
    }

    componentDidMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            user: nextProps.user,
            password: '',
            isChanged: false,
        });
    }

    updateUserField(key, value) {
        const newUser = Object.assign({}, this.state.user, { [key]: value });
        this.setState({
            user: newUser,
            isChanged: true,
        });
    }

    updatePassword(password) {
        this.setState({
            password,
            user: {
                ...this.state.user,
                password,
            },
            isChanged: true,
        });
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal large">
                    <div>
                        <label
                            htmlFor="userName"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.userName"
                                defaultMessage="Nom d'utilisateur"
                            />:
                        </label>
                        <input
                            type="text"
                            name="userName"
                            id="userName"
                            value={this.state.user.userName}
                            onChange={event => this.updateUserField('userName', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="firstName"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.firstName"
                                defaultMessage="Prénom"
                            />:
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            value={this.state.user.firstName}
                            onChange={event => this.updateUserField('firstName', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="lastName"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.lastName"
                                defaultMessage="Nom"
                            />:
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            value={this.state.user.lastName}
                            onChange={event => this.updateUserField('lastName', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="email"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.email"
                                defaultMessage="Email"
                            />:
                        </label>
                        <input
                            type="text"
                            name="email"
                            id="email"
                            value={this.state.user.email}
                            onChange={event => this.updateUserField('email', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.password"
                                defaultMessage="Nouveau mot de passe"
                            />:
                        </label>
                        <input
                            autoComplete="new-password"
                            type="password"
                            name="password"
                            id="password"
                            value={this.state.password}
                            onChange={event => this.updatePassword(event.currentTarget.value)}
                        />
                    </div>
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
                        </button>
                        <button
                            disabled={
                                (this.state.user.userName === '' ||
                                    (!this.state.isChanged && this.state.user.id !== 0) ||
                                    (this.state.user.id === 0 &&
                                        (this.state.user.email === '' || this.state.user.userName === '' || this.state.password === '')))
                            }
                            className="button--save"
                            onClick={() => this.props.saveData(this.state.user)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveUser" defaultMessage="Sauvegarder l'utilisateur" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
UserModale.defaultProps = {
    user: {
        id: 0,
        firstName: '',
    },
};
UserModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    user: PropTypes.object,
    saveData: PropTypes.func.isRequired,
};

export default injectIntl(UserModale);
