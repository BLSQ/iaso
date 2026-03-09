import React from 'react';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Details } from 'Iaso/domains/users/details';
import MESSAGES from 'Iaso/domains/users/messages';
import PERMISSIONS_MESSAGES from 'Iaso/domains/users/permissionsMessages';
import { renderWithTheme } from '../../../tests/helpers';
import { randomLanguage } from '../../factories/language';

// mocking hooks
vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useRedirectTo: () => vi.fn(),
    };
});

const { mockUseParamsObject } = vi.hoisted(() => {
    return { mockUseParamsObject: vi.fn() };
});

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

const { mockUseGetProfile } = vi.hoisted(() => {
    return { mockUseGetProfile: vi.fn() };
});

vi.mock('Iaso/domains/users/hooks/useGetProfiles', () => {
    return {
        ...vi.importActual('Iaso/domains/users/hooks/useGetProfiles'),
        useGetProfile: mockUseGetProfile,
    };
});

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', async () => {
    const actual = await vi.importActual('Iaso/utils/usersUtils');
    return {
        ...actual,
        useCurrentUser: mockCurrentUser,
    };
});

const mockSavePassword = vi.fn();
const mockIsSavePasswordLoading = vi.fn();

vi.mock('Iaso/domains/users/hooks/useSavePassword', () => ({
    useSavePassword: () => ({
        mutate: mockSavePassword,
        get isLoading() {
            return mockIsSavePasswordLoading();
        },
    }),
}));

const mockSaveProfile = vi.fn();
const mockIsSaveProfileLoading = vi.fn();
vi.mock('Iaso/domains/users/hooks/useSaveProfile', () => ({
    useSaveProfile: () => {
        return {
            mutate: mockSaveProfile,
            get isLoading() {
                return mockIsSaveProfileLoading();
            },
        };
    },
}));

vi.mock('Iaso/domains/users/hooks/useDeleteProfile', () => ({
    useDeleteProfile: () => {
        return {
            mutate: vi.fn(),
            isLoading: false,
        };
    },
}));

// fake data

const getRandomProject = () => {
    return {
        id: faker.string.numeric(3),
        name: faker.word.noun(),
        color: faker.color.rgb({ format: 'hex' }),
        app_id: faker.string.numeric(),
    };
};

const getRandomOrgUnit = () => {
    return {
        id: faker.string.numeric(3),
        name: faker.word.noun(),
    };
};

const getRandomUserRole = () => {
    return {
        id: faker.string.numeric(3),
        name: faker.word.noun(),
    };
};

const randomUser = {
    user_name: faker.internet.username(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    language: randomLanguage(),
    organization: faker.company.name(),
    phone_number: faker.phone.number(),
    home_page: faker.internet.url(),
    color: faker.color.rgb({ format: 'hex' }),
    projects: [getRandomProject(), getRandomProject()],
    orgUnits: [getRandomOrgUnit(), getRandomOrgUnit()],
    userRolesPermissions: [getRandomUserRole(), getRandomUserRole()],
    permissions: ['iaso_completeness', 'iaso_mappings'],
};

// actual tests

describe('User detail view integration test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsSaveProfileLoading.mockReturnValue(false);
        mockUseParamsObject.mockReturnValue({
            userId: 1,
        });
    });

    it('loads and displays user details when userId is provided', () => {
        mockUseGetProfile.mockReturnValue({
            data: randomUser,
            isLoading: false,
            error: null,
        });

        renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <Details />
            </IntlProvider>,
        );

        expect(
            screen.getByText(MESSAGES.generalInfo.defaultMessage),
        ).toBeInTheDocument();
        expect(
            screen.getByText(MESSAGES.projects.defaultMessage),
        ).toBeInTheDocument();
        expect(
            screen.getByText(MESSAGES.locations.defaultMessage),
        ).toBeInTheDocument();
        expect(
            screen.queryAllByText(MESSAGES.permissions.defaultMessage),
        ).not.toBeNull();
        expect(
            screen.getByText(MESSAGES.user_roles.defaultMessage),
        ).toBeInTheDocument();

        randomUser.projects.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        randomUser.orgUnits.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        randomUser.userRolesPermissions.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        randomUser.permissions.forEach((perm: string) => {
            // @ts-ignore
            expect(
                screen.getByText(PERMISSIONS_MESSAGES?.[perm]?.defaultMessage),
            ).toBeInTheDocument();
        });
    });
    // eslint-disable-next-line vitest/expect-expect
    it('deletes user and redirects to user list', async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('has all the initial fields filled in when updating the user', async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('reloads the data upon successful edit', async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it("doesn't reload the page upon successful password modification", async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('displays the user data', async () => {});
});

describe('User list integration test', () => {
    // eslint-disable-next-line vitest/expect-expect
    it('has all the initial fields filled in when updating the user', async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('reloads the data upon successful edit', async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('deletes user and reload data', async () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('reloads data upon successful create', async () => {});
});

describe('User general integration test', () => {
    // eslint-disable-next-line vitest/expect-expect
    it('allows going to a user detail view from the list view by clicking on the icon', () => {});
    // eslint-disable-next-line vitest/expect-expect
    it('allows going back to the user list from user detail view', () => {});
});
