import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import moment from 'moment';
import {
    History,
    NextByPass,
    NextTasks,
    ValidationNodeRetrieveResponse,
} from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';
import { apiMobileDateFormat } from 'Iaso/utils/dates';

type ValidationNodeRetrieveResponseFactoryTransientParams = {
    withHistory?: boolean;
    historyLength?: number;
    withNextTasks?: boolean;
    nextTasksLength: number;
    withNextByPass?: boolean;
    nextByPassLength?: number;
};

const historyFactory = Factory.define<History>(() => ({
    id: faker.number.int(250),
    level: faker.word.noun(5),
    color: faker.color.rgb({ format: 'hex' }) as `#${string}`,
    created_at: moment(faker.date.anytime()).format(apiMobileDateFormat),
    updated_at: moment(faker.date.anytime()).format(apiMobileDateFormat),
    status: faker.helpers.arrayElement([
        'ACCEPTED',
        'REJECTED',
        'SKIPPED',
        'UNKNOWN',
        'SUBMISSION',
        'NEW_VERSION',
    ]),
    updated_by: faker.person.fullName(),
    created_by: faker.person.fullName(),
    comment: faker.lorem.lines(2),
    node_template_slug: faker.lorem.slug(5),
}));

const userRolesFactory = Factory.define<{ id: number; name: string }>(() => ({
    id: faker.number.int(250),
    name: faker.word.noun({ length: 10, strategy: 'closest' }),
}));

const nextTasksFactory = Factory.define<NextTasks>(() => ({
    id: faker.number.int(250),
    name: faker.word.noun({ length: 10, strategy: 'closest' }),
    user_roles: userRolesFactory.buildList(2),
    node_template_slug: faker.lorem.slug(5),
}));

const nextByPassFactory = Factory.define<NextByPass>(() => ({
    slug: faker.lorem.slug(5),
    name: faker.word.noun({ length: 10, strategy: 'closest' }),
    user_roles: userRolesFactory.buildList(2),
}));

export const validationNodeRetrieveResponseFactory = Factory.define<
    ValidationNodeRetrieveResponse,
    ValidationNodeRetrieveResponseFactoryTransientParams
>(({ transientParams }) => ({
    validation_status: faker.helpers.arrayElement([
        'APPROVED',
        'REJECTED',
        'PENDING',
    ]),
    rejection_comment: faker.lorem.lines(2),
    workflow: faker.lorem.slug(3),
    history: !!transientParams?.withHistory
        ? historyFactory.buildList(transientParams?.historyLength ?? 0)
        : [],
    next_tasks: !!transientParams?.withNextTasks
        ? nextTasksFactory.buildList(transientParams?.nextTasksLength ?? 0)
        : [],
    next_bypass: !!transientParams?.withNextByPass
        ? nextByPassFactory.buildList(transientParams?.nextByPassLength ?? 0)
        : [],
}));
