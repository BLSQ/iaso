import {
    mutationInvalidates as workflowMutationInvalidates,
    workflowsOperations,
} from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...workflowsOperations,
    },
};

export const mutationInvalidates = [...workflowMutationInvalidates];
