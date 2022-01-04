import React from 'react';
import PropTypes from 'prop-types';

import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

const ProjectInfos = ({ setFieldValue, currentProject }) => (
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

ProjectInfos.propTypes = {
    setFieldValue: PropTypes.func.isRequired,
    currentProject: PropTypes.object.isRequired,
};

export default ProjectInfos;
