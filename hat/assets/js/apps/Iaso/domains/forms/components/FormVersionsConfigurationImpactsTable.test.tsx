import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ConfigurationImpact } from '../requests';
import FormVersionsConfigurationImpactsTable from './FormVersionsConfigurationImpactsTable';

const { mockReadableJsonLogicForForm, mockUser } = vi.hoisted(() => ({
    mockReadableJsonLogicForForm: vi.fn(),
    mockUser: { current: {} as Record<string, unknown> },
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: (await import('../../../../../tests/mocks/safeIntl'))
            .mockUseSafeIntl,
    };
});

vi.mock('../../workflows/hooks/useHumanReadableJsonLogicForForm', () => ({
    useHumanReadableJsonLogicForForm: mockReadableJsonLogicForForm,
}));

vi.mock('../../../utils/usersUtils', () => ({
    useCurrentUser: () => mockUser.current,
}));

vi.mock('../../users/utils', () => ({
    userHasPermission: (permission: string, user: Record<string, unknown>) =>
        Boolean(
            (user.permissions as string[] | undefined)?.includes(permission),
        ),
}));

vi.mock('../../../components/nav/LinkTo', () => ({
    LinkTo: ({
        condition,
        url,
        text,
        target,
    }: {
        condition: boolean;
        url: string;
        text: string;
        target: string;
    }) =>
        condition ? (
            <a href={url} target={target}>
                {text}
            </a>
        ) : (
            <>{text}</>
        ),
}));

const impact = (
    overrides: Partial<ConfigurationImpact>,
): ConfigurationImpact => ({
    kind: 'location_field',
    question: 'age',
    target_id: 1,
    target_name: 'Target',
    condition: null,
    entity_type_id: null,
    follow_up_order: null,
    mapping_source: null,
    mapping_target: null,
    ...overrides,
});

const configurationImpacts: ConfigurationImpact[] = [
    impact({
        kind: 'location_field',
        question: 'gps',
        target_id: 7,
        target_name: 'Child form',
    }),
    impact({
        kind: 'predefined_filter',
        target_id: 4,
        target_name: 'Toddlers',
        condition: { '<': [{ var: 'age' }, 3] },
    }),
    impact({
        kind: 'entity_type_list_field',
        target_id: 3,
        target_name: 'Patients & co',
    }),
    impact({
        kind: 'stock_rule',
        target_id: 12,
        target_name: '2026 rules / Vaccine',
    }),
    impact({
        kind: 'dhis2_mapping',
        target_id: 21,
        target_name: 'HMIS (AGGREGATE)',
    }),
    impact({
        kind: 'follow_up_condition',
        target_id: 9,
        target_name: 'Patients / Follow-ups (PUBLISHED)',
        entity_type_id: 3,
        follow_up_order: 2,
        condition: { '<': [{ var: 'age' }, 24] },
    }),
    impact({
        kind: 'change_mapping',
        question: 'birth_date',
        target_id: 9,
        target_name: 'Patients / Follow-ups (PUBLISHED)',
        entity_type_id: 3,
        mapping_source: 'dob',
        mapping_target: 'birth_date',
    }),
];

const ALL_PERMISSIONS = [
    'iaso_forms',
    'iaso_entities',
    'iaso_stock_management',
    'iaso_mappings',
    'iaso_workflows',
];

const renderTable = () =>
    renderWithThemeAndIntlProvider(
        <FormVersionsConfigurationImpactsTable
            formId={7}
            configurationImpacts={configurationImpacts}
        />,
    );

describe('FormVersionsConfigurationImpactsTable', () => {
    beforeEach(() => {
        mockReadableJsonLogicForForm.mockReset();
        mockReadableJsonLogicForForm.mockReturnValue(
            (logic: Record<string, unknown>) =>
                `readable ${JSON.stringify(logic)}`,
        );
        mockUser.current = { permissions: ALL_PERMISSIONS };
    });

    it('renders the title, the columns and one row per impact', () => {
        renderTable();

        expect(
            screen.getByText(
                'Removed or changed questions used in the configuration (7)',
            ),
        ).toBeInTheDocument();
        ['Name', 'Used in', 'To check'].forEach(header =>
            expect(
                screen.getByRole('columnheader', { name: header }),
            ).toBeInTheDocument(),
        );
        expect(screen.getAllByRole('row')).toHaveLength(8);
    });

    it('says where each question is used', () => {
        renderTable();

        [
            'GPS location question of the form',
            'Predefined filter',
            "Column of the entity type's list",
            'Stock rule',
            "Mapped to DHIS2, won't be mapped anymore",
            'Condition of follow-up 2',
            'Change mapping dob → birth_date',
        ].forEach(message =>
            expect(screen.getByText(message)).toBeInTheDocument(),
        );
    });

    it('shows the conditions as expressions, with the fields of the form', () => {
        renderTable();

        expect(mockReadableJsonLogicForForm).toHaveBeenCalledWith(7);
        expect(
            screen.getByText('readable {"<":[{"var":"age"},3]}'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('readable {"<":[{"var":"age"},24]}'),
        ).toBeInTheDocument();
        expect(screen.getAllByText(/^readable /)).toHaveLength(2);
    });

    it('links each configuration to its page, in a new tab', () => {
        renderTable();

        const hrefs = Object.fromEntries(
            screen.getAllByRole('link').map(link => {
                expect(link).toHaveAttribute('target', '_blank');
                return [link.textContent, link.getAttribute('href')];
            }),
        );
        expect(hrefs).toEqual({
            'Child form': '/forms/detail/formId/7',
            Toddlers: '/forms/detail/formId/7/tab/filters',
            'Patients & co': '/entities/types/search/Patients%20%26%20co',
            '2026 rules / Vaccine': '/stock/rulesversions/versionId/12',
            'HMIS (AGGREGATE)': '/forms/mapping/mappingVersionId/21',
            'Patients / Follow-ups (PUBLISHED)':
                '/workflows/details/entityTypeId/3/versionId/9',
        });
    });

    it('shows a configuration without link to users who cannot see its page', () => {
        mockUser.current = { permissions: ['iaso_forms'] };
        renderTable();

        expect(
            screen.getAllByRole('link').map(link => link.textContent),
        ).toEqual(['Child form', 'Toddlers']);
        expect(screen.getByText('2026 rules / Vaccine')).toBeInTheDocument();
    });

    it('shows the correlation question as an error, the label keys as the others', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsConfigurationImpactsTable
                formId={7}
                configurationImpacts={[
                    impact({
                        kind: 'correlation_field',
                        target_id: 7,
                        target_name: 'Child form',
                    }),
                    impact({
                        kind: 'label_key',
                        question: 'name',
                        target_id: 7,
                        target_name: 'Child form',
                    }),
                ]}
            />,
        );

        const correlation = screen.getByText(
            'Correlation question of the form: new submissions will fail to be processed',
        );
        expect(correlation).toHaveClass('MuiTypography-root');
        expect(getComputedStyle(correlation).color).not.toBe(
            getComputedStyle(
                screen.getByText('Label of the submissions and entities'),
            ).color,
        );
        screen
            .getAllByRole('link')
            .forEach(link =>
                expect(link).toHaveAttribute('href', '/forms/detail/formId/7'),
            );
    });

    it('shows a kind it does not know by its name, without link', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsConfigurationImpactsTable
                formId={7}
                configurationImpacts={[
                    impact({
                        kind: 'some_future_kind' as ConfigurationImpact['kind'],
                        target_name: 'Somewhere',
                    }),
                ]}
            />,
        );

        expect(screen.getByText('some_future_kind')).toBeInTheDocument();
        expect(screen.getByText('Somewhere')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});
