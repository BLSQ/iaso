import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { validationNodeRetrieveResponseFactory } from '../../../../../../__tests__/factories/validationWorkflows/validationNodes';
import { validationWorkflowRetrieveFactory } from '../../../../../../__tests__/factories/validationWorkflows/validationWorkflow';
import { QueryClientWrapper } from '../../../../../../tests/helpers';
import { useValidationTimeline } from './useValidationTimeline';

const { mockUserHasOneOfRoles } = vi.hoisted(() => {
    return { mockUserHasOneOfRoles: vi.fn() };
});
const { mockUseCurrentUser } = vi.hoisted(() => {
    return { mockUseCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockUseCurrentUser,
}));

vi.mock('Iaso/domains/users/utils', () => ({
    userHasOneOfRoles: mockUserHasOneOfRoles,
}));
describe('useValidationTimeline', () => {
    it('merges history, next_bypass, next_tasks correctly', () => {
        const currentUser = { id: 1, roles: ['admin'], is_superuser: false };
        mockUseCurrentUser.mockReturnValue(currentUser);
        mockUserHasOneOfRoles.mockReturnValue(true);

        const nodes = validationWorkflowRetrieveFactory.build({
            node_templates: [
                {
                    name: 'Node1',
                    description: 'desc1',
                    color: '#ff0000',
                    slug: 'node1',
                    can_skip_previous_nodes: true,
                },
                {
                    name: 'Node2',
                    description: 'desc2',
                    color: '#00ff00',
                    slug: 'node2',
                    can_skip_previous_nodes: true,
                },
            ],
        });

        const data = validationNodeRetrieveResponseFactory.build({
            history: [
                {
                    level: 'Node1',
                    status: 'ACCEPTED',
                    comment: 'ok',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: 123456,
                    created_at: 123456,
                    id: 1,
                    color: '#ff0000',
                },
            ],
            next_bypass: [
                {
                    name: 'Node2',
                    slug: 'node2-slug',
                    user_roles: [{ id: 1, name: 'admin' }],
                },
            ],
            next_tasks: [],
        });

        const { result } = renderHook(
            () => useValidationTimeline({ data, nodes }),
            { wrapper: QueryClientWrapper },
        );

        expect(result.current).toEqual([
            {
                label: 'Node1',
                content: {
                    comment: 'ok',
                    author: 'John',
                    date: 123456,
                },
                status: 'ACCEPTED',
                color: '#ff0000',
            },
            {
                label: 'Node2',
                content: { description: 'desc2' },
                status: 'inactive',
                color: '#00ff00',
                nodeSlug: 'node2-slug',
                canValidate: true,
            },
        ]);
    });
});
