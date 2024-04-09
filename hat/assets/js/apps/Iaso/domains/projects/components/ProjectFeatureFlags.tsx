import React, { FunctionComponent } from 'react';

import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import MESSAGES from '../messages';

import { FeatureFlag } from '../types/featureFlag';

export type Form = {
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
    featureFlags?: Array<FeatureFlag>;
    isFetchingFeatureFlag: boolean;
};

const ProjectFeatureFlags: FunctionComponent<Props> = ({
    setFieldValue,
    currentProject,
    featureFlags,
    isFetchingFeatureFlag,
}) => {
    const options = React.useMemo(
        () =>
            featureFlags?.map(fF => ({
                label: fF.name,
                value: fF.id,
            })),
        [featureFlags],
    );
    return (
        <InputComponent
            multi
            clearable
            keyValue="feature_flags"
            loading={isFetchingFeatureFlag}
            onChange={(key, value) =>
                setFieldValue(key, commaSeparatedIdsToArray(value))
            }
            value={currentProject.feature_flags.value.join(',')}
            errors={currentProject.feature_flags.errors}
            type="select"
            options={options}
            label={MESSAGES.featureFlags}
        />
    );
};

export { ProjectFeatureFlags };
