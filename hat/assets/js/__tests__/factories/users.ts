import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

export const currentUserFactory = Factory.define(() => ({
    id: faker.number.int(3),
    is_superuser: false,
    permissions: [],
}));
