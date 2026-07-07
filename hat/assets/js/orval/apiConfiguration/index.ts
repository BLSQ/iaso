import { acccountFeatureFlagsOperations } from './accountFeatureFlags/configuration';
import { acccountsOperations } from './accounts/configuration';
import { modulesOperations } from './modules/configuration';
import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...acccountsOperations,
        ...acccountFeatureFlagsOperations,
        ...modulesOperations,
        ...workflowsOperations,
    },
};
