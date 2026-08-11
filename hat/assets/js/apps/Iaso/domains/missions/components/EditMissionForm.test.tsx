import React from 'react';
import { screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { EditMissionForm } from './EditMissionForm';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');

    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (message: any) =>
                message.defaultMessage ?? message.id,
        }),
    };
});

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
        Field: ({ name }: any) => <div data-testid={`field-${name}`} />,
    };
});

vi.mock('Iaso/domains/missions/components/forms/MissionFormsBaseInput', () => ({
    MissionFormsBaseInput: () => <div data-testid="forms-base-input" />,
}));

vi.mock(
    'Iaso/domains/missions/components/forms/MissionOrgUnitTypeInput',
    () => ({
        MissionOrgUnitTypeInput: () => <div data-testid="org-unit-input" />,
    }),
);

vi.mock(
    'Iaso/domains/missions/components/forms/MissionEntityTypeInput',
    () => ({
        MissionEntityTypeInput: () => <div data-testid="entity-input" />,
    }),
);

vi.mock('Iaso/domains/missions/components/chips/FormsChip', () => ({
    FormsChip: () => <div data-testid="forms-chip" />,
}));

vi.mock('Iaso/domains/missions/components/chips/OrgUnitAndFormChip', () => ({
    OrgUnitAndFormChip: () => <div data-testid="org-unit-chip" />,
}));

vi.mock('Iaso/domains/missions/components/chips/EntityAndFormChip', () => ({
    EntityAndFormChip: () => <div data-testid="entity-chip" />,
}));

vi.mock('Iaso/domains/missions/components/details/InfosTitle', () => ({
    InfosTitle: () => <div data-testid="infos-title" />,
}));

const createFormik = (): FormikProps<any> =>
    ({
        handleSubmit: vi.fn(),
    }) as unknown as FormikProps<any>;

type Props = {
    missionType?: React.ComponentProps<typeof EditMissionForm>['missionType'];
};

const renderComponent = ({
    missionType = MissionTypeDa2Enum.enum.FORM_FILLING,
}: Props = {}) => {
    const formik = createFormik();

    renderWithThemeAndIntlProvider(
        <EditMissionForm missionType={missionType} formik={formik} />,
    );

    return { formik };
};

describe('EditMissionForm unit tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('always renders the common fields (name, description)', () => {
        renderComponent();

        expect(screen.getByTestId('field-name')).toBeInTheDocument();
        expect(screen.getByTestId('field-description')).toBeInTheDocument();
        expect(screen.getByTestId('infos-title')).toBeInTheDocument();
    });

    it('renders MissionFormsBaseInput and FormsChip for FORM_FILLING', () => {
        renderComponent({
            missionType: MissionTypeDa2Enum.enum.FORM_FILLING,
        });

        expect(screen.getByTestId('forms-base-input')).toBeInTheDocument();
        expect(screen.getByTestId('forms-chip')).toBeInTheDocument();
        expect(screen.queryByTestId('org-unit-input')).not.toBeInTheDocument();
        expect(screen.queryByTestId('entity-input')).not.toBeInTheDocument();
    });

    it('renders MissionOrgUnitTypeInput and OrgUnitAndFormChip for ORG_UNIT_AND_FORM', () => {
        renderComponent({
            missionType: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        });

        expect(screen.getByTestId('org-unit-input')).toBeInTheDocument();
        expect(screen.getByTestId('org-unit-chip')).toBeInTheDocument();
        expect(
            screen.queryByTestId('forms-base-input'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('entity-input')).not.toBeInTheDocument();
    });

    it('renders MissionEntityTypeInput and EntityAndFormChip for ENTITY_AND_FORM', () => {
        renderComponent({
            missionType: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
        });

        expect(screen.getByTestId('entity-input')).toBeInTheDocument();
        expect(screen.getByTestId('entity-chip')).toBeInTheDocument();
        expect(
            screen.queryByTestId('forms-base-input'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('org-unit-input')).not.toBeInTheDocument();
    });
});
