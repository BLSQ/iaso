import React, { FunctionComponent } from 'react';
import { ErrorBoundary } from 'bluesquare-components';
import { Instance } from '../types/instance';
import InstanceFileContentBasic from './InstanceFileContentBasic';
import InstanceFileContentRich, { Descriptor } from './InstanceFileContentRich';

type Props = {
    instance: Instance;
    showQuestionKey?: boolean;
    showNote?: boolean;
};

const InstanceFileContent: FunctionComponent<Props> = ({
    instance,
    showQuestionKey = true,
    showNote = true,
}) => {
    const hasDescriptor = instance?.form_descriptor;
    return (
        <ErrorBoundary>
            {hasDescriptor ? (
                <InstanceFileContentRich
                    instanceData={instance?.file_content}
                    formDescriptor={instance?.form_descriptor as Descriptor}
                    showQuestionKey={showQuestionKey}
                    showNote={showNote}
                    files={instance?.files ?? []} // Instance type gives files:ShortFile, but here we get string[]
                />
            ) : (
                <InstanceFileContentBasic
                    fileContent={instance?.file_content}
                />
            )}
        </ErrorBoundary>
    );
};

export default InstanceFileContent;
