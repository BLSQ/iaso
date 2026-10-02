import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { OrgUnitInfos, PARENT_BREADCRUMB_FIELDS } from './OrgUnitInfos';

const {
    mockUseGetOrgUnit,
    mockUseGetOrgUnitValidationStatus,
    mockUseCheckUserHasWritePermissionOnOrgunit,
} = vi.hoisted(() => ({
    mockUseGetOrgUnit: vi.fn(),
    mockUseGetOrgUnitValidationStatus: vi.fn(),
    mockUseCheckUserHasWritePermissionOnOrgunit: vi.fn(),
}));

vi.mock('./TreeView/requests', () => ({
    useGetOrgUnit: mockUseGetOrgUnit,
}));

vi.mock('../hooks/utils/useGetOrgUnitValidationStatus', () => ({
    useGetOrgUnitValidationStatus: mockUseGetOrgUnitValidationStatus,
}));

vi.mock('../../../utils/usersUtils', async importOriginal => {
    const actual =
        await importOriginal<typeof import('../../../utils/usersUtils')>();
    return {
        ...actual,
        useCheckUserHasWritePermissionOnOrgunit:
            mockUseCheckUserHasWritePermissionOnOrgunit,
    };
});

vi.mock('./TreeView/OrgUnitTreeviewModal', () => ({
    OrgUnitTreeviewModal: ({ initialSelection }: any) => (
        <div data-testid="treeview-modal">
            {initialSelection ? JSON.stringify(initialSelection) : 'none'}
        </div>
    ),
}));

vi.mock('./OrgUnitCreationDetails', () => ({
    OrgUnitCreationDetails: () => <div data-testid="creation-details" />,
}));

vi.mock('./OrgUnitMultiReferenceInstances', () => ({
    OrgUnitMultiReferenceInstances: () => (
        <div data-testid="reference-instances" />
    ),
}));

// DatesRange renders a real MUI DatePicker, which needs a LocalizationProvider
// this test doesn't set up -- stub it out, it's unrelated to the fields=
// behaviour under test here.
vi.mock('../../../components/filters/DatesRange', () => ({
    default: () => <div data-testid="dates-range" />,
}));

// InputComponent pulls in its own heavy dropdown/select machinery -- stub it
// out too, for the same reason.
vi.mock('../../../components/forms/InputComponent', () => ({
    default: () => <div data-testid="input-component" />,
}));

const makeOrgUnitState = (parent?: { id: number }): any => ({
    name: { value: 'Test OU', errors: [] },
    org_unit_type_id: { value: 1, errors: [] },
    groups: { value: [], errors: [] },
    code: { value: '', errors: [] },
    aliases: { value: [], errors: [] },
    validation_status: { value: 'VALID', errors: [] },
    source_ref: { value: '', errors: [] },
    parent: { value: parent, errors: [] },
    opening_date: { value: undefined, errors: [] },
    closed_date: { value: undefined, errors: [] },
});

const defaultProps = {
    onChangeInfo: vi.fn(),
    orgUnitTypes: [],
    groups: [],
    resetTrigger: false,
    handleSave: vi.fn(),
    handleReset: vi.fn(),
    orgUnitModified: false,
    isFetchingOrgUnitTypes: false,
    isFetchingGroups: false,
    referenceInstances: [],
    orgUnit: {},
};

describe('OrgUnitInfos', () => {
    beforeEach(() => {
        mockUseGetOrgUnit.mockReset();
        mockUseGetOrgUnit.mockReturnValue({ data: undefined });
        mockUseGetOrgUnitValidationStatus.mockReset();
        mockUseGetOrgUnitValidationStatus.mockReturnValue({
            data: [],
            isLoading: false,
        });
        mockUseCheckUserHasWritePermissionOnOrgunit.mockReset();
        mockUseCheckUserHasWritePermissionOnOrgunit.mockReturnValue(true);
    });

    it('requests the parent org unit with the breadcrumb-only fields allow-list, omitting instances_count', () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitInfos
                {...defaultProps}
                orgUnitState={makeOrgUnitState({ id: 7 })}
                params={{ orgUnitId: '42' }}
            />,
        );

        expect(mockUseGetOrgUnit).toHaveBeenCalledWith(
            '7',
            PARENT_BREADCRUMB_FIELDS,
        );
        expect(PARENT_BREADCRUMB_FIELDS).not.toContain('instances_count');
    });

    it('uses parentOrgUnitId from params (not the org unit state) when creating a new org unit', () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitInfos
                {...defaultProps}
                orgUnitState={makeOrgUnitState(undefined)}
                params={{ orgUnitId: '0', parentOrgUnitId: '99' }}
            />,
        );

        expect(mockUseGetOrgUnit).toHaveBeenCalledWith(
            '99',
            PARENT_BREADCRUMB_FIELDS,
        );
    });

    it('does not fetch a parent when there is none, but still passes the fields allow-list', () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitInfos
                {...defaultProps}
                orgUnitState={makeOrgUnitState(undefined)}
                params={{ orgUnitId: '42' }}
            />,
        );

        expect(mockUseGetOrgUnit).toHaveBeenCalledWith(
            undefined,
            PARENT_BREADCRUMB_FIELDS,
        );
    });

    it('forwards the trimmed parent org unit (without instances_count) as the treeview initial selection', () => {
        const trimmedParent = {
            id: 7,
            name: 'Parent OU',
            org_unit_type: { sub_unit_types: [{ id: 3 }] },
        };
        mockUseGetOrgUnit.mockReturnValue({ data: trimmedParent });

        renderWithThemeAndIntlProvider(
            <OrgUnitInfos
                {...defaultProps}
                orgUnitState={makeOrgUnitState({ id: 7 })}
                params={{ orgUnitId: '42' }}
            />,
        );

        expect(screen.getByTestId('treeview-modal')).toHaveTextContent(
            'Parent OU',
        );
        expect(screen.getByTestId('treeview-modal').textContent).not.toContain(
            'instances_count',
        );
    });
});
