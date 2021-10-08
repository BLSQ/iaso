import React from 'react';
import PropTypes from 'prop-types';

import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import MESSAGES from '../messages';

const ProjectFeatureFlags = ({
    setFieldValue,
    currentProject,
    featureFlags,
}) => {
    return (
        <InputComponent
            multi
            clearable
            keyValue="feature_flags"
            onChange={(key, value) =>
                setFieldValue(key, commaSeparatedIdsToArray(value))
            }
            value={currentProject.feature_flags.value.join(',')}
            errors={currentProject.feature_flags.errors}
            type="select"
            options={featureFlags.map(fF => ({
                label: fF.name,
                value: fF.id,
            }))}
            label={MESSAGES.featureFlags}
        />
    );
};

ProjectFeatureFlags.propTypes = {
    setFieldValue: PropTypes.func.isRequired,
    currentProject: PropTypes.object.isRequired,
    featureFlags: PropTypes.array.isRequired,
};

export default ProjectFeatureFlags;
