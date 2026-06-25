import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { TeamTable } from './TeamTable';

const mockUpdateTeam = vi.fn();
const mockUpdateUser = vi.fn();
const captureAssigneeRowProps = vi.fn();

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
        }),
    };
});

vi.mock('Iaso/domains/teams/hooks/requests/useSaveTeam', () => ({
    useSaveTeam: () => ({
        mutate: mockUpdateTeam,
    }),
}));

vi.mock('Iaso/domains/users/hooks/useSaveProfile', () => ({
    useSaveProfile: () => ({
        mutate: mockUpdateUser,
    }),
}));

vi.mock('Iaso/utils/usersUtils', () => ({
    __esModule: true,
    default: (user: { username: string }) => `Display ${user.username}`,
}));

vi.mock('./AssigneeRow', () => ({
    AssigneeRow: (props: Record<string, unknown>) => {
        captureAssigneeRowProps(props);
        return (
            <tr data-testid={`assignee-row-${props.displayName as string}`}>
                <td>{props.displayName as string}</td>
            </tr>
        );
    },
}));

const rootTeam = {
    id: 1,
    name: 'Main Team',
    manager: 1,
    sub_teams: [11, 10],
    sub_teams_details: [
        { id: 11, name: 'Zulu Team', color: '#111111' },
        { id: 10, name: 'Alpha Team', color: '#222222' },
    ],
    project: 2,
    users: [3, 2],
    users_details: [
        {
            id: 3,
            username: 'zed',
            first_name: 'Z',
            last_name: 'E',
            color: '#333333',
            iaso_profile_id: 30,
        },
        {
            id: 2,
            username: 'amy',
            first_name: 'A',
            last_name: 'M',
            color: '#444444',
            iaso_profile_id: 20,
        },
    ],
    created_at: '2024-01-01',
    color: '#555555',
};

const assignments = {
    assignments: [],
    allAssignments: [
        {
            id: 1,
            planning: 7,
            user: 2,
            team: 0,
            org_unit: 100,
            org_unit_details: {
                id: 100,
                name: 'A',
                latitude: null,
                longitude: null,
                geo_json: null,
            },
        },
        {
            id: 2,
            planning: 7,
            user: 0,
            team: 11,
            org_unit: 101,
            org_unit_details: {
                id: 101,
                name: 'B',
                latitude: null,
                longitude: null,
                geo_json: null,
            },
        },
    ],
};

const defaultProps = {
    planningId: '7',
    rootTeam: rootTeam as any,
    isLoadingRootTeam: false,
    selectedUser: undefined,
    setSelectedUser: vi.fn(),
    selectedTeam: undefined,
    setSelectedTeam: vi.fn(),
    assignments: assignments as any,
};

describe('TeamTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders team name and creates one row per sub-team and user', () => {
        renderWithThemeAndIntlProvider(<TeamTable {...defaultProps} />);

        const rows = captureAssigneeRowProps.mock.calls.map(
            call => call[0] as any,
        );
        const renderedNames = new Set(rows.map(row => row.displayName));

        expect(screen.getByText('Main Team')).toBeInTheDocument();
        expect(renderedNames).toEqual(
            new Set(['Zulu Team', 'Alpha Team', 'Display amy', 'Display zed']),
        );
    });

    it('sorts user rows by username before passing them to AssigneeRow', () => {
        renderWithThemeAndIntlProvider(<TeamTable {...defaultProps} />);

        const userRows = captureAssigneeRowProps.mock.calls
            .map(call => call[0])
            .filter((props: any) => props.user);

        expect(userRows[0].user.username).toBe('amy');
        expect(userRows[1].user.username).toBe('zed');
    });

    it('wires sub-team row selection and team color update', () => {
        renderWithThemeAndIntlProvider(<TeamTable {...defaultProps} />);
        const subTeamRow = captureAssigneeRowProps.mock.calls[0][0] as any;

        subTeamRow.setSelectedRow();
        expect(defaultProps.setSelectedTeam).toHaveBeenCalledWith(
            rootTeam.sub_teams_details[0],
        );
        expect(defaultProps.setSelectedUser).toHaveBeenCalledWith(undefined);

        subTeamRow.onColorChange('#ff00ff');
        expect(mockUpdateTeam).toHaveBeenCalledWith({
            id: rootTeam.sub_teams_details[0].id,
            color: '#ff00ff',
        });
    });

    it('wires user row selection and user color update', () => {
        renderWithThemeAndIntlProvider(<TeamTable {...defaultProps} />);
        const userRows = captureAssigneeRowProps.mock.calls
            .map(call => call[0] as any)
            .filter(props => props.user);
        const firstUserRow = userRows[0];

        firstUserRow.setSelectedRow();
        expect(defaultProps.setSelectedUser).toHaveBeenCalledWith(
            firstUserRow.user,
        );
        expect(defaultProps.setSelectedTeam).toHaveBeenCalledWith(undefined);

        firstUserRow.onColorChange('#00aaff');
        expect(mockUpdateUser).toHaveBeenCalledWith({
            id: firstUserRow.user.iaso_profile_id,
            color: '#00aaff',
        });
    });

    it('passes assignment counts to rows for teams and users', () => {
        renderWithThemeAndIntlProvider(<TeamTable {...defaultProps} />);

        const rows = captureAssigneeRowProps.mock.calls.map(
            call => call[0] as any,
        );
        const teamRow = rows.find(row => row.team?.id === 11);
        const amyRow = rows.find(row => row.user?.username === 'amy');
        const zedRow = rows.find(row => row.user?.username === 'zed');

        expect(teamRow.count).toBe(1);
        expect(amyRow.count).toBe(1);
        expect(zedRow.count).toBe(0);
    });
});
