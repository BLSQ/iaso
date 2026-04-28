import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import {
    NestedNodeTemplate,
    ValidationWorkflowRetrieveResponseItem,
} from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';

type ValidationWorkflowRetrieveFactoryTransientParams = {
    withNodeTemplates?: boolean;
    nodeTemplatesLength?: number;
};

const nodeTemplateFactory = Factory.define<NestedNodeTemplate>(() => ({
    slug: faker.lorem.slug(5),
    name: faker.word.noun({ length: 10, strategy: 'closest' }),
    description: faker.lorem.lines(3),
    color: faker.color.rgb({ format: 'hex' }) as `#${string}`,
    can_skip_previous_nodes: true,
}));

export const validationWorkflowRetrieveFactory = Factory.define<
    ValidationWorkflowRetrieveResponseItem,
    ValidationWorkflowRetrieveFactoryTransientParams
>(({ transientParams }) => ({
    slug: faker.lorem.slug(5),
    name: faker.word.noun({ length: 10, strategy: 'closest' }),
    created_at: faker.date.anytime().toDateString(),
    updated_at: faker.date.anytime().toDateString(),
    description: faker.lorem.lines(3),
    created_by: faker.person.fullName(),
    updated_by: faker.person.fullName(),
    node_templates: !!transientParams?.withNodeTemplates
        ? nodeTemplateFactory.buildList(
              transientParams?.nodeTemplatesLength ?? 0,
          )
        : [],
}));
