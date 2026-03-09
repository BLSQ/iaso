import { faker } from '@faker-js/faker';

export const randomLanguage = () => {
    return faker.helpers.arrayElement([
        "en",
        "fr",
        "es"
    ])
}