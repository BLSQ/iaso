import { accountFeatureFlagsOperations } from './accountFeatureFlags/configuration';
import { acccountsOperations } from './accounts/configuration';
import { apiImportsOperations } from './apiImports/configuration';
import { modulesOperations } from './modules/configuration';
import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...acccountsOperations,
        ...accountFeatureFlagsOperations,
        ...apiImportsOperations,
        ...modulesOperations,
        ...workflowsOperations,
    },
};
