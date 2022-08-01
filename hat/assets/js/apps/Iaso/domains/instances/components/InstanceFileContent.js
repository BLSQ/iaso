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
        const { instance, showQuestionKey, showNote, logId } = this.props;
        const hasDescriptor = instance.form_descriptor !== null;

        return !this.state.hasError && hasDescriptor ? (
            <InstanceFileContentRich
                logId={logId}
                instanceData={instance.file_content}
                formDescriptor={instance.form_descriptor}
                showQuestionKey={showQuestionKey}
                showNote={showNote}
            />
        ) : (
            <InstanceFileContentBasic fileContent={instance.file_content} />
        );
    }
}

InstanceFileContent.defaultProps = {
    showQuestionKey: true,
    showNote: true,
    logId: null,
};

InstanceFileContent.propTypes = {
    instance: PropTypes.object.isRequired,
    showQuestionKey: PropTypes.bool,
    showNote: PropTypes.bool,
    logId: PropTypes.string,
};
