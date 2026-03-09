import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import {
    ExtendedNestedProject,
    ProfileListResponseItem,
    ProfileRetrieveResponseItem,
} from 'Iaso/domains/users/types';
import { randomLanguage } from './language';

export const profileRetrieveProjectFactory =
    Factory.define<ExtendedNestedProject>(() => ({
        id: faker.string.numeric(3),
        name: faker.word.words(2),
        color: faker.color.rgb({ format: 'hex' }),
        appId: faker.string.numeric(5),
    }));

type ProfileRetrieveResponseItemFactoryTransientParams = {
    withProjects?: boolean;
    projectsLength?: number;
};
export const profileRetrieveResponseItemFactory = Factory.define<
    Partial<ProfileRetrieveResponseItem>,
    ProfileRetrieveResponseItemFactoryTransientParams
>(({ transientParams }) => ({
    userName: faker.internet.username(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    language: randomLanguage(),
    organization: faker.company.name(),
    phoneNumber: faker.phone.number(),
    homePage: faker.internet.url(),
    color: faker.color.rgb({ format: 'hex' }),
    projects: !!transientParams?.withProjects
        ? profileRetrieveProjectFactory.buildList(
              transientParams?.projectsLength ?? 0,
          )
        : [],
}));

export const profileListResponseItemFactory = Factory.define<
    Partial<ProfileListResponseItem>
>(() => ({
    userName: faker.internet.username(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    language: randomLanguage(),
    organization: faker.company.name(),
    phoneNumber: faker.phone.number(),
    homePage: faker.internet.url(),
    color: faker.color.rgb({ format: 'hex' }),
}));
