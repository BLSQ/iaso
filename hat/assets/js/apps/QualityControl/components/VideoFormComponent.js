import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import TestVideoComponent from './TestVideoComponent';
import { isSuperUser } from '../../../utils/index';
import SuperUserVideoComponent from './superUser/SuperUserVideoComponent';


class VideoFormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isClear: false,
            isGoodPlace: false,
            isConfirmedCase: false,
            hasOtherParasite: false,
            comment: '',
        };
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
        const { userLevel } = this.props;
        const { comment } = this.state;
        return (
            <form>
                {
                    isSuperUser(userLevel) &&
                    <SuperUserVideoComponent
                        currentTest={this.props.currentTest}
                    />
                }
                {
                    (!isSuperUser(userLevel)) &&
                    <TestVideoComponent
                        changeOption={key => this.changeOption(key)}
                        isClear={this.state.isClear}
                        isGoodPlace={this.state.isGoodPlace}
                        isConfirmedCase={this.state.isConfirmedCase}
                        hasOtherParasite={this.state.hasOtherParasite}
                        isSuperUser={isSuperUser(userLevel)}
                    />
                }
                {
                    (!isSuperUser(userLevel)) &&
                    <div>
                        <section>
                            <div className="quality-label inline comment-label">
                                <FormattedMessage
                                    id="main.label.comment"
                                    defaultMessage="Comment"
                                />:
                            </div>
                            <div className="comment-container">
                                <textarea
                                    name="comment"
                                    value={comment}
                                    onChange={event => this.setState({ comment: event.currentTarget.value })}
                                />
                            </div>
                        </section>
                    </div>
                }
                {
                    (!isSuperUser(userLevel)) &&
                    <div className="submit-area">
                        {
                            this.props.error &&
                            <div className="saving--error">
                                <FormattedMessage id="main.label.submit.error" defaultMessage="An error occured while saving" />
                            </div>
                        }
                        <button
                            className="button"
                            onClick={e => this.onSubmit(e)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="main.label.validate" defaultMessage="Validate" />
                        </button>
                    </div>
                }
            </form>);
    }
}

VideoFormComponent.defaultProps = {
    error: null,
};

VideoFormComponent.propTypes = {
    submitForm: PropTypes.func.isRequired,
    error: PropTypes.object,
    userLevel: PropTypes.number.isRequired,
    currentTest: PropTypes.object.isRequired,
};

const VideoFormComponentIntl = injectIntl(VideoFormComponent);

export default VideoFormComponentIntl;
