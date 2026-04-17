import React from 'react';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { Details } from 'Iaso/domains/users/details';
import MESSAGES from 'Iaso/domains/users/messages';
import PERMISSIONS_MESSAGES from 'Iaso/domains/users/permissionsMessages';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';
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

vi.mock('@mui/lab', () => ({
    Masonry: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="masonry">{children}</div>
    ),
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

const getRandomOrgUnitWriteType = () => {
    return {
        id: faker.string.numeric(5),
        name: faker.word.words(3),
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
    org_units: [getRandomOrgUnit(), getRandomOrgUnit()],
    user_roles_permissions: [getRandomUserRole(), getRandomUserRole()],
    permissions: ['iaso_completeness', 'iaso_mappings'],
    editable_org_unit_types: [
        getRandomOrgUnitWriteType(),
        getRandomOrgUnitWriteType(),
    ],
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

        renderWithThemeAndIntlProvider(<Details />);

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
        expect(
            screen.getByText(MESSAGES.orgUnitWriteTypes.defaultMessage),
        ).toBeInTheDocument();

        randomUser.projects.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        randomUser.org_units.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        randomUser.user_roles_permissions.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        randomUser.permissions.forEach((perm: string) => {
            // @ts-ignore
            expect(
                screen.getByText(
                    (
                        PERMISSIONS_MESSAGES as Record<
                            string,
                            { id: string; defaultMessage: string }
                        >
                    )?.[perm]?.defaultMessage,
                ),
            ).toBeInTheDocument();
        });

        randomUser.editable_org_unit_types.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });
    });
    it.todo('deletes user and redirects to user list');
    it.todo('has all the initial fields filled in when updating the user');
    it.todo('reloads the data upon successful edit');
    it.todo("doesn't reload the page upon successful password modification");
    it.todo('displays the user data');
});

describe('User list integration test', () => {
    it.todo('has all the initial fields filled in when updating the user');
    it.todo('reloads the data upon successful edit');
    it.todo('deletes user and reload data');
    it.todo('reloads data upon successful create');
    it.todo('allows selecting different columns');
    it.todo('allows ordering on columns');
});

describe('User general integration test', () => {
    it.todo(
        'allows going to a user detail view from the list view by clicking on the icon',
    );
    it.todo('allows going back to the user list from user detail view');
});
