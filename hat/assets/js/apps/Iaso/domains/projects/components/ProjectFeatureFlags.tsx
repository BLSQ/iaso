import React, { FunctionComponent, useState } from 'react';

import { FeatureFlag } from '../types/featureFlag';
import { FeatureFlagsSwitches } from './FeatureFlagsSwitches';

export type Form = {
    value: Array<string | number>;
    errors: Array<string>;
};

type Props = {
    setFieldValue: (key: string, value: string) => void;
    projectFeatureFlagsValues: (string | number)[];
    featureFlags?: FeatureFlag[];
    isFetchingFeatureFlag: boolean;
};

const ProjectFeatureFlags: FunctionComponent<Props> = ({
    setFieldValue,
    projectFeatureFlagsValues = [],
    featureFlags = [],
    isFetchingFeatureFlag,
}) => {
    const [featureFlagsValues, setFeatureFlagsValues] = useState<
        (string | number)[]
    >(projectFeatureFlagsValues);

    const handleFeatureFlagChange = newFeatureFlags => {
        setFeatureFlagsValues(newFeatureFlags);
        setFieldValue('feature_flags', newFeatureFlags);
    };

    return (
        <FeatureFlagsSwitches
            featureFlags={featureFlags}
            projectFeatureFlagsValues={featureFlagsValues}
            handleChange={handleFeatureFlagChange}
            isLoading={isFetchingFeatureFlag}
        />
    );
};

export { ProjectFeatureFlags };
