import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InstanceFileContentRich from './InstanceFileContentRich';
import InstanceFileContentBasic from './InstanceFileContentBasic';

/**
 * Wrapper component for instance file content
 * (uses the error boundary pattern - see https://reactjs.org/docs/error-boundaries.html)
 *
 */
export default class InstanceFileContent extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error(error);
    }

    render() {
        const { instance, showQuestionKey, showNote, isInstanceLog } =
            this.props;
        const hasDescriptor =
            !isInstanceLog && instance.form_descriptor !== null;

        console.log('instance', instance);

        return !this.state.hasError && hasDescriptor ? (
            <InstanceFileContentRich
                instanceData={
                    isInstanceLog ? instance.json : instance.file_content
                }
                formDescriptor={!isInstanceLog && instance.form_descriptor}
                showQuestionKey={showQuestionKey}
                showNote={showNote}
            />
        ) : (
            !isInstanceLog && (
                <InstanceFileContentBasic fileContent={instance.file_content} />
            )
        );
    }
}

InstanceFileContent.defaultProps = {
    showQuestionKey: true,
    showNote: true,
    isInstanceLog: false,
};

InstanceFileContent.propTypes = {
    instance: PropTypes.object.isRequired,
    showQuestionKey: PropTypes.bool,
    showNote: PropTypes.bool,
    isInstanceLog: PropTypes.bool,
};
