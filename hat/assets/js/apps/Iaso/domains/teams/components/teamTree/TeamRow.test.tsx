import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TeamType } from 'Iaso/domains/teams/constants';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EditableTeamRow } from './TeamRow';

const makeTeam = (type?: TeamType): TeamTreeNode => ({
    id: 2,
    name: 'Team A',
    type,
    color: '#000000',
    parent: 1,
    depth: 1,
    users: [],
    children: [],
});

const openRowMenu = (team: TeamTreeNode) => {
    const onAction = vi.fn();
    renderWithThemeAndIntlProvider(
        <EditableTeamRow
            row={{ kind: 'team', team, depth: 1, isExpanded: false }}
            canDropOn={() => false}
            onToggle={vi.fn()}
            onAction={onAction}
        />,
    );
    fireEvent.click(screen.getByLabelText('More actions'));
    return onAction;
};

describe('EditableTeamRow add actions', () => {
    it('shows only add users for a team of users and emits addUsers', () => {
        const team = makeTeam(TeamType.enum.TEAM_OF_USERS);
        const onAction = openRowMenu(team);

        expect(screen.queryByText('Add subteam')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Add users'));

        expect(onAction).toHaveBeenCalledWith({ kind: 'addUsers', team });
    });

    it('shows only add subteam for a team of teams and emits addSubTeam', () => {
        const team = makeTeam(TeamType.enum.TEAM_OF_TEAMS);
        const onAction = openRowMenu(team);

        expect(screen.queryByText('Add users')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Add subteam'));

        expect(onAction).toHaveBeenCalledWith({ kind: 'addSubTeam', team });
    });

    it('shows both add actions for a team without type', () => {
        openRowMenu(makeTeam());

        expect(screen.getByText('Add users')).toBeInTheDocument();
        expect(screen.getByText('Add subteam')).toBeInTheDocument();
    });
});
