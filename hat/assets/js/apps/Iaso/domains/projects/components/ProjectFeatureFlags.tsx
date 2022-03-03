import React, { FunctionComponent } from 'react';

import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import MESSAGES from '../messages';

import { FeatureFlag } from '../types/featureFlag';

type Form = {
    value: Array<string>;
    errors: Array<string>;
};

type ProjectForm = {
    feature_flags: Form;
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: string) => void;
    currentProject: ProjectForm;
    featureFlags: Array<FeatureFlag>;
};

const ProjectFeatureFlags: FunctionComponent<Props> = ({
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

export { ProjectFeatureFlags };
