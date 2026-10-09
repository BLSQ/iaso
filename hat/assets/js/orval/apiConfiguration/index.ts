import { accountFeatureFlagsOperations } from './accountFeatureFlags/configuration';
import { accountsOperations } from './accounts/configuration';
import { apiImportsOperations } from './apiImports/configuration';
import { instanceDiffOperations } from './instanceDiff/configuration';
import { missionsOperations } from './missions/configuration';
import { modulesOperations } from './modules/configuration';
import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...accountsOperations,
        ...accountFeatureFlagsOperations,
        ...apiImportsOperations,
        ...instanceDiffOperations,
        ...missionsOperations,
        ...modulesOperations,
        ...workflowsOperations,
    },
};
