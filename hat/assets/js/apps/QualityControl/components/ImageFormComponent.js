import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import TestImageComponent from './TestImageComponent';
import SuperUserImageComponent from './superUser/SuperUserImageComponent';
import { isMediumUser, isSuperUser } from '../../../utils/index';

const groupCattTests = (test) => {
    const cattTests = [];
    const testClone = {
        ...test,
    };
    if (test.other_catt && test.other_catt.length > 0) {
        delete testClone.other_catt;
        test.other_catt.forEach((catt) => {
            cattTests.push(catt);
        });
    }
    testClone.current = true;
    cattTests.push(testClone);
    cattTests.sort((a, b) => {
        if (parseInt(a.index, 10) < parseInt(b.index, 10)) {
            return -1;
        }
        return 1;
    });
    return cattTests;
};

class ImageFormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTest: props.currentTest,
            groupedCattTests: groupCattTests(props.currentTest),
            isSubmitDisabled: true,
            comment: '',
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            currentTest: nextProps.currentTest,
            groupedCattTests: groupCattTests(nextProps.currentTest),
            isSubmitDisabled: true,
        });
    }

    onSubmit(e) {
        e.preventDefault();
        const test = {
            ...this.state.currentTest,
        };
        if (isMediumUser(this.props.userLevel) && test.other_catt) {
            delete test.other_catt;
        }
        this.props.submitForm(test, this.state.comment);
    }

    changeResult(result, imageItemId) {
        const currentTest = {
            ...this.state.currentTest,
        };
        if (imageItemId === this.state.currentTest.id) {
            currentTest.result = result;
        } else {
            const tempOtherCatt = [...this.state.currentTest.other_catt];
            this.state.currentTest.other_catt.forEach((catt, index) => {
                if (catt.id === imageItemId) {
                    tempOtherCatt[index].result = result;
                }
            });
            currentTest.other_catt = tempOtherCatt;
        }
        this.setState({
            currentTest,
            groupedCattTests: groupCattTests(currentTest),
            isSubmitDisabled: false,
        });
    }

    render() {
        const { currentTest, groupedCattTests, comment } = this.state;
        const { userLevel } = this.props;
        let formClasses = isMediumUser(userLevel) || isSuperUser(userLevel) ? 'with-comment ' : '';
        formClasses += isSuperUser(userLevel) ? 'super-user' : '';
        return (
            <form className={formClasses}>
                {
                    isSuperUser(userLevel) &&
                    <SuperUserImageComponent
                        currentTest={currentTest}
                    />
                }
                {
                    (currentTest.type === 'RDT' ||
                        (currentTest.type === 'CATT' &&
                            (isMediumUser(userLevel) || isSuperUser(userLevel)))) &&
                            <TestImageComponent
                                test={currentTest}
                                isSuperUser={isSuperUser(userLevel)}
                                isMediumUser={isMediumUser(userLevel)}
                                changeResult={(result, imageItemId) => this.changeResult(result, imageItemId)}
                            />
                }
                {
                    currentTest.type === 'CATT' &&
                    !isMediumUser(userLevel) &&
                    !isSuperUser(userLevel) &&
                    groupedCattTests.map(catt =>
                        (<TestImageComponent
                            key={`catt-${catt.id}`}
                            test={catt}
                            changeResult={(result, imageItemId) => this.changeResult(result, imageItemId)}
                        />))
                }
                {
                    (isMediumUser(userLevel) || isSuperUser(userLevel)) &&
                    <div>
                        <section>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="main.label.comment"
                                    defaultMessage="Commentaire"
                                />:
                            </div>
                            <div className="comment-container">
                                <textarea
                                    name="comment"
                                    id={`comment-${currentTest.id}`}
                                    value={comment}
                                    onChange={event => this.setState({ comment: event.currentTarget.value })}
                                />
                            </div>
                        </section>
                    </div>
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
                        disabled={this.state.isSubmitDisabled}
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
    currentTest: PropTypes.object.isRequired,
    userLevel: PropTypes.number.isRequired,
};

const ImageFormComponentIntl = injectIntl(ImageFormComponent);

export default ImageFormComponentIntl;
