import React, { FunctionComponent } from 'react';
import { ErrorBoundary } from 'bluesquare-components';
import InstanceFileContentBasic from './InstanceFileContentBasic';
import InstanceFileContentRich from './InstanceFileContentRich';
import { Instance } from '../types/instance';

type Props = {
    instance: Instance;
    showQuestionKey?: boolean;
    showNote?: boolean;
};

export const InstanceFileContent: FunctionComponent<Props> = ({
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
                    formDescriptor={instance?.form_descriptor}
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
