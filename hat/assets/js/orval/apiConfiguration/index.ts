import { acccountsOperations } from './accounts/configuration';
import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...workflowsOperations,
        ...acccountsOperations,
    },
};
