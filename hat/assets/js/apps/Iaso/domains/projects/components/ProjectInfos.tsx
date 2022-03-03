import React, { FunctionComponent } from 'react';

import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

type Form = {
    value: string | null;
    errors: Array<string>;
};

type ProjectForm = {
    app_id: Form;
    name: Form;
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: string) => void;
    currentProject: ProjectForm;
};

const ProjectInfos: FunctionComponent<Props> = ({
    setFieldValue,
    currentProject,
}) => (
    <>
        <InputComponent
            keyValue="name"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentProject.name.value}
            errors={currentProject.name.errors}
            type="text"
            label={MESSAGES.projectName}
            required
        />
        <InputComponent
            keyValue="app_id"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentProject.app_id.value}
            errors={currentProject.app_id.errors}
            type="text"
            label={MESSAGES.appId}
            required
        />
    </>
);

export { ProjectInfos };
