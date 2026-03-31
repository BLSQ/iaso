import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import {
    NestedNodeTemplate,
    ValidationWorkflowListResponse,
    ValidationWorkflowListResponseItem,
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

const validationWorkflowListItemFactory =
    Factory.define<ValidationWorkflowListResponseItem>(() => ({
        slug: faker.lorem.slug(3),
        name: faker.word.noun({ length: 10, strategy: 'closest' }),
        form_count: faker.number.int({ max: 100 }),
        created_by: faker.person.fullName(),
        updated_by: faker.person.fullName(),
        created_at: faker.date.anytime().toLocaleDateString(),
        updated_at: faker.date.anytime().toLocaleDateString(),
    }));

type ValidationWorkflowListFactoryTransientParams = {
    resultsLength?: number;
};

export const validationWorkflowListFactory = Factory.define<
    ValidationWorkflowListResponse,
    ValidationWorkflowListFactoryTransientParams
>(({ transientParams }) => ({
    count: transientParams?.resultsLength ?? 2,
    has_next: true,
    has_previous: false,
    page: 1,
    pages: 1,
    limit: 5,
    results: validationWorkflowListItemFactory.buildList(
        transientParams?.resultsLength ?? 2,
    ),
}));
