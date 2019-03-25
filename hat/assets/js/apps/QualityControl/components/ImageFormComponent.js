import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import TestImageComponent from './TestImageComponent';

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
        };
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.submitForm(this.state.currentTest);
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
        const { currentTest, groupedCattTests } = this.state;
        return (
            <form>
                {
                    currentTest.type === 'RDT' &&
                    <TestImageComponent
                        test={currentTest}
                        changeResult={(result, imageItemId) => this.changeResult(result, imageItemId)}
                    />
                }
                {
                    currentTest.type === 'CATT' &&
                    groupedCattTests.map(catt =>
                        (<TestImageComponent
                            key={`catt-${catt.id}`}
                            test={catt}
                            changeResult={(result, imageItemId) => this.changeResult(result, imageItemId)}
                        />))
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
};

const ImageFormComponentIntl = injectIntl(ImageFormComponent);

export default ImageFormComponentIntl;
