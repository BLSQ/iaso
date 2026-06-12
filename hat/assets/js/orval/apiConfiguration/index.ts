import { modulesOperations } from './modules/configuration';
import { orgUnitTypesOperations } from './orgUnitTypes/configuration';
import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...orgUnitTypesOperations,
        ...modulesOperations,
        ...workflowsOperations,
    },
};
