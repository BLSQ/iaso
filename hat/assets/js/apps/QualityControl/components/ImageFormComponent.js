import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ResultTestTypeConstant from '../../../utils/constants/ResultTestTypeConstant';


class ImageFormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            result: undefined,
        };
    }

    componentWillReceiveProps() {
        this.setState({
            result: undefined,
        });
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.submitForm(this.state);
    }

    changeResult(result) {
        this.setState({
            result,
        });
    }

    render() {
        return (
            <form>
                <div>
                    <section>
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.image.results"
                                defaultMessage="Résultat"
                            />:
                        </div>
                        {
                            ResultTestTypeConstant.map((type) => {
                                const messageProps = {
                                    id: type.id,
                                    defaultMessage: type.defaultMessage,
                                };
                                return (
                                    <div className="quality-radio" key={type.value}>
                                        <input
                                            type="radio"
                                            name="result"
                                            checked={type.value === this.state.result ? 'checked' : ''}
                                            value={type.value}
                                            onChange={() => this.changeResult(type.value)}
                                        />
                                        <FormattedMessage {... messageProps} />
                                    </div>
                                );
                            })
                        }
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
                        disabled={typeof this.state.result === 'undefined'}
                        onClick={e => this.onSubmit(e)}
                    >
                        <i className="fa fa-save" />
                        <FormattedMessage id="main.submit" defaultMessage="Valider" />
                    </button>
                </div>
            </form>);
    }
}


ImageFormComponent.defaultProps = {
    error: null,
};

ImageFormComponent.propTypes = {
    submitForm: PropTypes.func.isRequired,
    error: PropTypes.object,
};

const ImageFormComponentIntl = injectIntl(ImageFormComponent);

export default ImageFormComponentIntl;
