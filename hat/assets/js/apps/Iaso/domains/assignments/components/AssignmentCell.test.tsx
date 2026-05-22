import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaginatedAssignment } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { AssignmentCell } from './AssignmentCell';

describe('AssignmentCell', () => {
    it('renders a user chip when the assignment has a user', () => {
        const assignment = {
            id: 1,
            assignment_type: 'user' as const,
            user: {
                id: 10,
                username: 'jdoe',
                first_name: 'Jane',
                last_name: 'Doe',
                color: '#336699',
            },
            team: null,
        } as PaginatedAssignment;

        renderWithThemeAndIntlProvider(<AssignmentCell value={assignment} />);

        expect(screen.getByText(/jdoe \(Jane Doe\)/i)).toBeVisible();
    });

    it('renders a team chip when the assignment has no user but has a team', () => {
        const assignment = {
            id: 2,
            assignment_type: 'team' as const,
            user: null,
            team: {
                id: 3,
                name: 'Field team',
                color: '#884400',
            },
        } as PaginatedAssignment;

        renderWithThemeAndIntlProvider(<AssignmentCell value={assignment} />);

        expect(screen.getByText('Field team')).toBeVisible();
    });

    it('renders the text placeholder when there is no assignment', () => {
        renderWithThemeAndIntlProvider(<AssignmentCell value={null} />);

        expect(screen.getByText('--')).toBeVisible();
    });

    it('renders the text placeholder when assignment has neither user nor team', () => {
        const assignment = {
            id: 3,
            user: null,
            team: null,
            assignment_type: null,
        } as PaginatedAssignment;

        renderWithThemeAndIntlProvider(<AssignmentCell value={assignment} />);

        expect(screen.getByText('--')).toBeVisible();
    });
});
