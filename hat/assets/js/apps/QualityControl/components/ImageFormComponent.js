import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { CattTypeConstant, RdtTypeConstant } from '../../../utils/constants/ImageTypeConstant';


class ImageFormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            imageItems: props.imageItems,
            isSubmitEnabled: true,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            imageItems: nextProps.imageItems,
        });
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.submitForm(this.state.imageItems);
    }

    changeResult(result, imageItemId) {
        const imageItems = [];
        let isSubmitEnabled = false;
        this.state.imageItems.map((i) => {
            const tempImageitem = i;
            if (i.id === imageItemId) {
                tempImageitem.result = result;
            }
            if (typeof i.result === 'undefined') {
                isSubmitEnabled = true;
            }
            imageItems.push(tempImageitem);
            return null;
        });
        this.setState({
            imageItems,
            isSubmitEnabled,
        });
    }

    render() {
        const typeConstant = this.props.imageItems[0].type === 'RDT' ?
            RdtTypeConstant : CattTypeConstant;

        return (
            <form>
                {
                    this.state.imageItems.map(imageItem => (
                        <div key={`test-${imageItem.id}`}>
                            {
                                !imageItem.index && imageItem.type === 'CATT' &&
                                <section>
                                    <div className="quality-label inline">
                                        <FormattedMessage
                                            id="quality.image.noindex"
                                            defaultMessage="aucun index fourni"
                                        />
                                    </div>
                                </section>
                            }
                            {
                                imageItem.index &&
                                <section>
                                    <div className="quality-label inline">
                                        <FormattedMessage
                                            id="quality.image.index"
                                            defaultMessage="Test n°:"
                                        />:
                                    </div>
                                    <div>{imageItem.index}</div>
                                </section>
                            }
                            <section>
                                <div className="quality-label inline">
                                    <FormattedMessage
                                        id="quality.image.results"
                                        defaultMessage="Résultat"
                                    />:
                                </div>
                                {
                                    typeConstant.map((type) => {
                                        const messageProps = {
                                            id: type.id,
                                            defaultMessage: type.defaultMessage,
                                        };
                                        return (
                                            <div className="quality-radio" key={type.value}>
                                                <input
                                                    type="radio"
                                                    id={`result-${type.value}-${imageItem.id}`}
                                                    name={`result-${type.value}-${imageItem.id} `}
                                                    checked={type.value === imageItem.result ? 'checked' : ''}
                                                    value={type.value}
                                                    onChange={() => this.changeResult(type.value, imageItem.id)}
                                                />
                                                <label htmlFor={`result-${type.value}-${imageItem.id}`}>
                                                    <FormattedMessage {...messageProps} />
                                                </label>
                                            </div>
                                        );
                                    })
                                }
                            </section>
                        </div>
                    ))
                }
                <div className="submit-area">
                    {
                        this.props.error &&
                        <div className="saving--error">
                            <FormattedMessage id="main.submit.error" defaultMessage="Erreur lors de la sauvegarde" />
                        </div>
                    }
                    <button
                        className="button"
                        disabled={this.state.isSubmitEnabled}
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
    imageItems: PropTypes.array.isRequired,
};

const ImageFormComponentIntl = injectIntl(ImageFormComponent);

export default ImageFormComponentIntl;
