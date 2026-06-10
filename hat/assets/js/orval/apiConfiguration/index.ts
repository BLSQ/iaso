import { modulesOperations } from './modules/configuration';
import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...modulesOperations,
        ...workflowsOperations,
    },
};
