import React, { FunctionComponent } from 'react';

import { FeatureFlag, ProjectFeatureFlag } from '../types/featureFlag';
import { FeatureFlagsSwitches } from './FeatureFlagsSwitches';

export type Form = {
    value: Array<string | number>;
    errors: Array<string>;
};

type Props = {
    onFeatureFlagsChanged: (value: FeatureFlag[]) => void;
    projectFeatureFlags: ProjectFeatureFlag[];
    featureFlags: FeatureFlag[];
    isFetchingFeatureFlag: boolean;
};

const ProjectFeatureFlags: FunctionComponent<Props> = ({
    onFeatureFlagsChanged,
    projectFeatureFlags = [],
    featureFlags = [],
    isFetchingFeatureFlag,
}) => {
    return (
        <FeatureFlagsSwitches
            featureFlags={featureFlags}
            projectFeatureFlags={projectFeatureFlags}
            onFeatureFlagsChanged={onFeatureFlagsChanged}
            isLoading={isFetchingFeatureFlag}
        />
    );
};

export { ProjectFeatureFlags };
