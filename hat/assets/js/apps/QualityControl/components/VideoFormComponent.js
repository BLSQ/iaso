import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';


class VideoFormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            result: -3,
            isClear: false,
            isGoodPlace: false,
            isConfirmedCase: false,
            hasOtherParasites: false,
        };
    }

    componentWillReceiveProps() {
        this.setState({
            result: -3,
        });
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.submitForm(this.state);
    }

    changeOption(key) {
        this.setState({
            [key]: !this.state[key],
        });
    }

    render() {
        return (
            <form>
                <div>
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.main.isClear"
                                defaultMessage="Netteté"
                            />:
                        </div>

                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="isClear"
                                value={this.state.isClear}
                                checked={this.state.isClear ? 'checked' : ''}
                                onChange={() => this.changeOption('isClear')}
                            />
                            <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="isClear"
                                value={this.state.isClear}
                                checked={!this.state.isClear ? 'checked' : ''}
                                onChange={() => this.changeOption('isClear')}
                            />
                            <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                        </div>
                    </section>
                    {
                        this.state.isClear &&
                        <section>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.main.search"
                                    defaultMessage="Recherche parasite au bon endroit"
                                />:
                            </div>
                            <div className="quality-radio">
                                <input
                                    type="radio"
                                    name="isGoodPlace"
                                    value={this.state.isGoodPlace}
                                    checked={this.state.isGoodPlace ? 'checked' : ''}
                                    onChange={() => this.changeOption('isGoodPlace')}
                                />
                                <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                            </div>
                            <div className="quality-radio">
                                <input
                                    type="radio"
                                    name="isGoodPlace"
                                    value={this.state.isGoodPlace}
                                    checked={!this.state.isGoodPlace ? 'checked' : ''}
                                    onChange={() => this.changeOption('isGoodPlace')}
                                />
                                <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                            </div>
                        </section>
                    }

                    {
                        this.state.isClear &&
                        <section>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.main.confirm"
                                    defaultMessage="Confirmation vue trypanosome"
                                />:
                            </div>
                            <div className="quality-radio">
                                <input
                                    type="radio"
                                    name="isConfirmedCase"
                                    value={this.state.isConfirmedCase}
                                    checked={this.state.isConfirmedCase ? 'checked' : ''}
                                    onChange={() => this.changeOption('isConfirmedCase')}
                                />
                                <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                            </div>
                            <div className="quality-radio">
                                <input
                                    type="radio"
                                    name="isConfirmedCase"
                                    value={this.state.isConfirmedCase}
                                    checked={!this.state.isConfirmedCase ? 'checked' : ''}
                                    onChange={() => this.changeOption('isConfirmedCase')}
                                />
                                <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                            </div>
                        </section>
                    }

                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.main.otherParasites"
                                defaultMessage="Autre parasite"
                            />:
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="hasOtherParasites"
                                value={this.state.hasOtherParasites}
                                checked={this.state.hasOtherParasites ? 'checked' : ''}
                                onChange={() => this.changeOption('hasOtherParasites')}
                            />
                            <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                        </div>
                        <div className="quality-radio">
                            <input
                                type="radio"
                                name="hasOtherParasites"
                                value={this.state.hasOtherParasites}
                                checked={!this.state.hasOtherParasites ? 'checked' : ''}
                                onChange={() => this.changeOption('hasOtherParasites')}
                            />
                            <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                        </div>
                    </section>
                </div>
                <div className="submit-area">
                    {
                        this.props.error &&
                        <div className="saving--error">
                            <FormattedMessage id="main.submit.error" defaultMessage="Erreur lors de la sauvegarde" />
                        </div>
                    }
                    <button
                        className="button"
                        onClick={e => this.onSubmit(e)}
                    >
                        <i className="fa fa-save" />
                        <FormattedMessage id="main.submit" defaultMessage="Valider" />
                    </button>
                </div>
            </form>);
    }
}

VideoFormComponent.defaultProps = {
    error: null,
};

VideoFormComponent.propTypes = {
    submitForm: PropTypes.func.isRequired,
    error: PropTypes.object,
};

const VideoFormComponentIntl = injectIntl(VideoFormComponent);

export default VideoFormComponentIntl;
