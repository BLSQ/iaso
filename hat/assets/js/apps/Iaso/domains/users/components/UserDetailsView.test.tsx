import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import { textPlaceholder } from 'bluesquare-components';
import Page404 from 'Iaso/components/errors/Page404';
import { Project } from 'Iaso/domains/projects/types/project';
import { UserDetailsView } from 'Iaso/domains/users/components/UserDetailsView';
import MESSAGES from 'Iaso/domains/users/messages';
import * as Permission from 'Iaso/utils/permissions';
import { randomLanguage } from '../../../../../__tests__/factories/language';
import { renderWithTheme } from '../../../../../tests/helpers';

// mock utilities functions
const mockRedirectTo = vi.fn();

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        LoadingSpinner: () => <div data-testid="loading-spinner" />,
        useRedirectTo: () => mockRedirectTo,
        useSafeIntl: () => ({
            formatMessage: (msg: any) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? 'msg'),
        }),
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

// mocking hooks
const { mockUseGetProfile } = vi.hoisted(() => {
    return { mockUseGetProfile: vi.fn() };
});

vi.mock('Iaso/domains/users/hooks/useGetProfiles', () => {
    return {
        ...vi.importActual('Iaso/domains/users/hooks/useGetProfiles'),
        useGetProfile: mockUseGetProfile,
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

// mock components
vi.mock('Iaso/components/errors/Page404', () => ({
    default: ({ customMessage }: React.ComponentProps<typeof Page404>) => (
        <div data-testid={'page-404'}>{customMessage}</div>
    ),
}));

vi.mock('Iaso/components/dialogs/DeleteDialogComponent', () => ({
    default: () => <div data-testid={'delete-dialog'}></div>,
}));

vi.mock('Iaso/domains/users/components/EditPasswordUserDialog', () => ({
    EditPasswordUserWithButtonDialog: () => (
        <div data-testid={'edit-user-password-dialog'}></div>
    ),
}));

vi.mock('Iaso/components/dialogs/EditUserDialog', () => ({
    EditUserWithButtonDialog: () => (
        <div data-testid={'edit-user-dialog'}></div>
    ),
}));

vi.mock('Iaso/domains/projects/components/ProjectChip', () => ({
    ProjectChip: ({ project }: { project: Project }) => (
        <div data-testid={'project-chip'}>{project?.name}</div>
    ),
}));

vi.mock('Iaso/domains/users/components/PermissionTable', () => {
    return {
        PermissionTable: ({ data }: { data?: string[] }) => (
            <div data-testid={'permission-table'}>
                {data?.map((d: string) => (
                    <span key={d}>
                        {d}
                        <br />
                    </span>
                ))}
            </div>
        ),
    };
});

vi.mock('@mui/lab', () => ({
    Masonry: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="masonry">{children}</div>
    ),
}));

// fake data
const randomUser = {
    user_name: faker.internet.username(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    language: randomLanguage(),
    organization: faker.company.name(),
    phone_number: faker.phone.number(),
    home_page: faker.internet.url(),
    date_joined: faker.date.past().toISOString(),
    color: faker.color.rgb({ format: 'hex' }),
};

let projectCounter = 0;
const getRandomProject = () => {
    projectCounter += 1;
    return {
        id: faker.string.numeric(3),
        name: `project_${projectCounter}_${faker.string.alphanumeric(6)}`,
        color: faker.color.rgb({ format: 'hex' }),
        app_id: faker.string.numeric(3),
    };
};

const getRandomOrgUnit = () => {
    return {
        id: faker.string.numeric(3),
        name: faker.word.noun({ length: 10 }),
    };
};

const getRandomUserRole = () => {
    return {
        id: faker.string.numeric(3),
        name: faker.word.sample({ length: 10 }),
    };
};

describe('UsersDetailView unit tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsSavePasswordLoading.mockReturnValue(false);
        mockIsSaveProfileLoading.mockReturnValue(false);
        mockCurrentUser.mockReturnValue(undefined);
    });

    it('shows general spinner while loading (retrieve)', () => {
        mockUseGetProfile.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        });

        renderWithTheme(<UserDetailsView userId="1" />);
        expect(screen.queryAllByTestId('loading-spinner')).toHaveLength(1);
        expect(
            screen.queryByText(MESSAGES.generalInfo.defaultMessage),
        ).toBeNull();
        expect(screen.queryByTestId('delete-dialog')).toBeNull();
        expect(screen.queryByTestId('edit-user-dialog')).toBeNull();
        expect(screen.queryByTestId('edit-user-password-dialog')).toBeNull();
    });
    it('renders 404 page if user is not found', () => {
        mockUseGetProfile.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 404 },
        });

        renderWithTheme(<UserDetailsView userId={'1'} />);
        expect(screen.getByTestId('page-404')).toBeInTheDocument();
        expect(screen.getByText('User not found')).toBeInTheDocument();
        expect(screen.queryByText('General info')).toBeNull();
        expect(screen.queryByTestId('delete-dialog')).toBeNull();
        expect(screen.queryByTestId('edit-user-dialog')).toBeNull();
        expect(screen.queryByTestId('edit-user-password-dialog')).toBeNull();
    });
    it.each([
        {
            label: 'general info',
            title: MESSAGES.generalInfo.defaultMessage,
            sectionDataTestId: 'general-info-box',
        },
        {
            label: 'projects',
            title: MESSAGES.projects.defaultMessage,
            sectionDataTestId: 'projects-info-box',
        },
        {
            label: 'user roles',
            title: MESSAGES.userRoles.defaultMessage,
            sectionDataTestId: 'user-roles-info-box',
        },
        {
            label: 'locations',
            title: MESSAGES.locations.defaultMessage,
            sectionDataTestId: 'locations-info-box',
        },
        {
            label: 'permissions',
            title: MESSAGES.permissions.defaultMessage,
            sectionDataTestId: 'permissions-info-box',
        },
    ])(
        'renders a spinner in the user $label box while saving',
        ({
            title,
            sectionDataTestId,
        }: {
            title: string;
            sectionDataTestId: string;
        }) => {
            mockIsSaveProfileLoading.mockReturnValue(true);
            mockUseGetProfile.mockReturnValue({
                data: randomUser,
                isLoading: false,
                error: null,
            });

            renderWithTheme(<UserDetailsView userId={'1'} />);

            expect(
                within(screen.getByTestId(sectionDataTestId)).getByTestId(
                    'loading-spinner',
                ),
            ).toBeInTheDocument();
            expect(screen.getByText(title)).toBeInTheDocument();
        },
    );

    it('renders correctly user general info', () => {
        mockUseGetProfile
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: randomUser,
                isLoading: false,
                error: null,
            });
        const { rerender } = renderWithTheme(<UserDetailsView userId={'1'} />);

        expect(screen.getByText('General info')).toBeInTheDocument();
        expect(screen.queryAllByText(textPlaceholder)).toHaveLength(10);

        rerender(<UserDetailsView userId={'1'} />);
        expect(screen.getByText('General info')).toBeInTheDocument();
        expect(screen.queryByText(textPlaceholder)).toBeNull();
        Object.entries(randomUser)
            .filter(([k, _]) => k !== 'color' && k !== 'date_joined')
            .forEach(([k, v]) => {
                expect(
                    screen.getByText(v),
                    // @ts-ignore
                    `Field ${k} with value ${v} should be in the document`,
                ).toBeInTheDocument();
            });

        const emailLink = screen.getByRole('link', {
            name: randomUser.email,
        });

        expect(emailLink).toHaveAttribute('href', `mailto:${randomUser.email}`);

        const phoneLink = screen.getByRole('link', {
            name: randomUser.phone_number,
        });

        expect(phoneLink).toHaveAttribute(
            'href',
            `tel:${randomUser.phone_number}`,
        );

        expect(screen.getByTestId('user-color-badge')).toBeInTheDocument();
    });

    it('renders correctly projects info', () => {
        const projects = [getRandomProject(), getRandomProject()];

        mockUseGetProfile
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    projects: [],
                },
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    projects: projects,
                },
                isLoading: false,
                error: null,
            });

        const { rerender } = renderWithTheme(<UserDetailsView userId={'1'} />);

        expect(
            within(screen.getByTestId('projects-info-box')).getByRole('alert'),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('projects-info-box')).getByRole('alert'),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        // check that we render some projects
        expect(screen.queryAllByTestId('project-chip')).toHaveLength(2);
        projects.forEach(({ name }) => {
            expect(screen.queryAllByText(name).length).toBeGreaterThan(0);
        });
    });

    it('renders correctly user roles info', () => {
        const user_roles = [getRandomUserRole(), getRandomUserRole()];

        mockUseGetProfile
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    user_roles_permissions: [],
                },
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    user_roles_permissions: user_roles,
                },
                isLoading: false,
                error: false,
            });

        const { rerender } = renderWithTheme(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('user-roles-info-box')).getByRole(
                'alert',
            ),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('user-roles-info-box')).getByRole(
                'alert',
            ),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        user_roles.forEach(({ name }) => {
            expect(
                within(screen.getByTestId('user-roles-info-box')).getByText(
                    name,
                ),
            ).toBeInTheDocument();
        });
    });

    it('renders correctly permissions info', () => {
        const permissions = [faker.word.verb(), faker.word.verb()];

        mockUseGetProfile
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    permissions: [],
                },
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    permissions: permissions,
                },
                isLoading: false,
                error: null,
            });

        const { rerender } = renderWithTheme(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('permissions-info-box')).getByRole(
                'alert',
            ),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('permissions-info-box')).getByRole(
                'alert',
            ),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        expect(screen.getByTestId('permission-table')).toBeDefined();
        permissions.forEach(perm => {
            expect(
                within(screen.getByTestId('permission-table')).getByText(perm),
            ).toBeInTheDocument();
        });
    });

    it('renders correctly locations info', () => {
        const org_units = [getRandomOrgUnit(), getRandomOrgUnit()];

        mockUseGetProfile
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    org_units: [],
                },
                isLoading: false,
                error: null,
            })
            .mockReturnValueOnce({
                data: {
                    org_units: org_units,
                },
                isLoading: false,
                error: false,
            });

        const { rerender } = renderWithTheme(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('locations-info-box')).getByRole('alert'),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        expect(
            within(screen.getByTestId('locations-info-box')).getByRole('alert'),
        ).toHaveTextContent(MESSAGES.noResultsFound.defaultMessage);

        rerender(<UserDetailsView userId={'1'} />);
        org_units.forEach(({ name }) => {
            expect(
                within(screen.getByTestId('locations-info-box')).getByText(
                    name,
                ),
            ).toBeInTheDocument();
        });
    });

    it('does not show delete button for own profile', () => {
        mockUseGetProfile.mockReturnValue({
            data: randomUser,
            isLoading: false,
            error: null,
        });

        mockCurrentUser.mockReturnValue({
            id: 1,
        });

        renderWithTheme(<UserDetailsView userId={'1'} />);

        expect(screen.queryByTestId('delete-dialog')).toBeNull();
    });

    it('shows delete button for admin on other user', () => {
        mockUseGetProfile.mockReturnValue({
            data: randomUser,
            isLoading: false,
            error: null,
        });

        mockCurrentUser.mockReturnValue({
            id: 1,
            permissions: [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
        });

        renderWithTheme(<UserDetailsView userId={'2'} />);

        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('hides delete button for non admin on other user', () => {
        mockUseGetProfile.mockReturnValue({
            data: randomUser,
            isLoading: false,
            error: null,
        });
        mockCurrentUser.mockReturnValue({
            id: 1,
            permissions: [],
        });
        renderWithTheme(<UserDetailsView userId={'2'} />);
        expect(screen.queryByTestId('delete-dialog')).toBeNull();
    });
});
