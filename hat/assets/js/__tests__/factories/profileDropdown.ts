import { faker } from '@faker-js/faker';

import { DropdownOptions } from 'Iaso/types/utils';

export const randomProfileDropdownOption = (
    overrides?: Partial<DropdownOptions<number>>,
): DropdownOptions<number> => ({
    label: faker.person.fullName(),
    value: faker.number.int({ min: 1, max: 999_999 }),
    ...overrides,
});

export const randomProfileDropdownOptions = (
    count: number,
): DropdownOptions<number>[] =>
    Array.from({ length: count }, () => randomProfileDropdownOption());

/** Response shape when `limit` is set on `/api/profiles/dropdown/`. */
export type ProfilesDropdownLimitedResponse = {
    results: DropdownOptions<number>[];
};

export const randomProfilesDropdownLimitedResponse = (
    count = 3,
): ProfilesDropdownLimitedResponse => ({
    results: randomProfileDropdownOptions(count),
});
