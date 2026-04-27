import { renderHook } from '@testing-library/react';
import moment from 'moment';
import { describe, it, expect, vi } from 'vitest';
import { apiMobileDateFormat } from 'Iaso/utils/dates';
import { validationNodeRetrieveResponseFactory } from '../../../../../../__tests__/factories/validationWorkflows/validationNodes';
import { validationWorkflowRetrieveFactory } from '../../../../../../__tests__/factories/validationWorkflows/validationWorkflow';
import { QueryClientWrapperWithIntlProvider } from '../../../../../../tests/helpers';
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
                    can_skip_previous_nodes: false,
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

        const date = moment(new Date()).format(apiMobileDateFormat);
        let data = validationNodeRetrieveResponseFactory.build({
            history: [
                {
                    level: 'Node1',
                    status: 'ACCEPTED',
                    comment: 'ok',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 1,
                    color: '#ff0000',
                    node_template_slug: 'node1',
                },
                {
                    level: 'Node1',
                    status: 'NEW_VERSION',
                    comment: '',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 3,
                    color: '#ff0000',
                    node_template_slug: 'node1',
                },
                {
                    level: 'Node2',
                    status: 'REJECTED',
                    comment: 'Nope',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 2,
                    color: '#00ff00',
                    node_template_slug: 'node2',
                },
                {
                    level: 'Node1',
                    status: 'SUBMISSION',
                    comment: '',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 1,
                    color: '#ff0000',
                    node_template_slug: 'node1',
                },
            ],
            next_bypass: [
                {
                    name: 'Node2',
                    slug: 'node2',
                    user_roles: [{ id: 1, name: 'admin' }],
                },
            ],
            next_tasks: [
                {
                    id: 3,
                    name: 'Node2',
                    node_template_slug: 'node2',
                    user_roles: [{ id: 1, name: 'admin' }],
                },
            ],
        });

        const { result, rerender } = renderHook(
            props => useValidationTimeline(props),
            {
                wrapper: QueryClientWrapperWithIntlProvider,
                initialProps: { data, nodes },
            },
        );

        expect(result.current).toEqual([
            {
                canValidate: true,
                color: '#00ff00',
                content: {
                    description: 'desc2',
                },
                label: 'Node2',
                nodeId: 3,
                nodeSlug: 'node2',
                order: 2,
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: 'ok',
                    date: date,
                    description: 'desc1',
                },
                label: 'Node1',
                nodeSlug: 'node1',
                order: 1,
                status: 'ACCEPTED',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: '',
                    date: date,
                    description: 'desc1',
                },
                label: 'New version',
                nodeSlug: 'node1',
                order: 1,
                previous: true,
                status: 'NEW_VERSION',
            },
            {
                color: '#00ff00',
                content: {
                    author: 'John',
                    comment: 'Nope',
                    date: date,
                    description: 'desc2',
                },
                label: 'Node2',
                nodeSlug: 'node2',
                order: 2,
                previous: true,
                status: 'REJECTED',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: '',
                    date: date,
                    description: 'desc1',
                },
                label: 'Submission',
                nodeSlug: 'node1',
                order: 1,
                previous: true,
                status: 'SUBMISSION',
            },
        ]);

        data = validationNodeRetrieveResponseFactory.build({
            history: [
                {
                    level: 'Node2',
                    status: 'REJECTED',
                    comment: 'Nope',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 5,
                    color: '#00ff00',
                    node_template_slug: 'node2',
                },
                {
                    level: 'Node1',
                    status: 'ACCEPTED',
                    comment: 'ok',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 4,
                    color: '#ff0000',
                    node_template_slug: 'node1',
                },
                {
                    level: 'Node1',
                    status: 'NEW_VERSION',
                    comment: '',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 3,
                    color: '#ff0000',
                    node_template_slug: 'node1',
                },
                {
                    level: 'Node2',
                    status: 'REJECTED',
                    comment: 'Nope',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 2,
                    color: '#00ff00',
                    node_template_slug: 'node2',
                },
                {
                    level: 'Node1',
                    status: 'SUBMISSION',
                    comment: '',
                    updated_by: 'John',
                    created_by: 'John',
                    updated_at: date,
                    created_at: date,
                    id: 1,
                    color: '#ff0000',
                    node_template_slug: 'node1',
                },
            ],
            next_bypass: [
                {
                    name: 'Node2',
                    slug: 'node2',
                    user_roles: [{ id: 1, name: 'admin' }],
                },
            ],
            next_tasks: [],
        });
        rerender({ data, nodes });

        expect(result.current).toEqual([
            {
                color: '#00ff00',
                content: {
                    author: 'John',
                    comment: 'Nope',
                    date: date,
                    description: 'desc2',
                },
                label: 'Node2',
                nodeSlug: 'node2',
                order: 2,
                status: 'REJECTED',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: 'ok',
                    date: date,
                    description: 'desc1',
                },
                label: 'Node1',
                nodeSlug: 'node1',
                order: 1,
                status: 'ACCEPTED',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: '',
                    date: date,
                    description: 'desc1',
                },
                label: 'New version',
                nodeSlug: 'node1',
                order: 1,
                previous: true,
                status: 'NEW_VERSION',
            },
            {
                color: '#00ff00',
                content: {
                    author: 'John',
                    comment: 'Nope',
                    date: date,
                    description: 'desc2',
                },
                label: 'Node2',
                nodeSlug: 'node2',
                order: 2,
                previous: true,
                status: 'REJECTED',
            },
            {
                color: '#ff0000',
                content: {
                    author: 'John',
                    comment: '',
                    date: date,
                    description: 'desc1',
                },
                label: 'Submission',
                nodeSlug: 'node1',
                order: 1,
                previous: true,
                status: 'SUBMISSION',
            },
        ]);
    });
});
