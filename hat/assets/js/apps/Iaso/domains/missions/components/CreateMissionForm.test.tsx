import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';

import { CreateMissionForm } from './CreateMissionForm';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');

    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (message: any) =>
                message.defaultMessage ?? message.id ?? '',
        }),
    };
});

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
        Field: ({ name, component: Component, ...props }: any) => {
            if (Component) {
                return <Component name={name} {...props} />;
            }

            return <div data-testid={`field-${name}`} />;
        },
    };
});

vi.mock('Iaso/components/papers/WidgetPaperComponent', () => ({
    default: ({ children }: any) => <>{children}</>,
}));

vi.mock('Iaso/domains/pages/components/TextInput', () => ({
    default: ({ name }: any) => <div data-testid={`field-${name}`} />,
}));

const missionTypeDropdownSpy = vi.fn();

vi.mock('Iaso/domains/missions/components/MissionTypeCardsInput', () => ({
    MissionTypeCardsInput: (props: any) => {
        missionTypeDropdownSpy(props);

        return (
            <button
                data-testid="mission-type-cards"
                onClick={() =>
                    props.onChange(
                        'mission_type',
                        MissionTypeDa2Enum.enum.FORM_FILLING,
                    )
                }
            >
                Mission type
            </button>
        );
    },
}));

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

const createFormik = (missionType?: any): FormikProps<any> =>
    ({
        values: {
            mission_type: missionType,
        },
        handleSubmit: vi.fn(),
        setFieldValue: vi.fn(),
        setFieldTouched: vi.fn(),
    }) as unknown as FormikProps<any>;

type RenderProps = {
    missionType?: any;
};

const renderComponent = ({ missionType }: RenderProps = {}) => {
    const formik = createFormik(missionType);

    render(<CreateMissionForm formik={formik} />);

    return { formik };
};

describe('CreateMissionForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the common fields', () => {
        renderComponent();

        expect(screen.getByTestId('field-name')).toBeInTheDocument();
        expect(screen.getByTestId('field-description')).toBeInTheDocument();

        expect(screen.getByTestId('mission-type-cards')).toBeInTheDocument();
    });

    it('shows the info alert when no mission type is selected', () => {
        renderComponent();

        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders MissionFormsBaseInput for FORM_FILLING', () => {
        renderComponent({
            missionType: MissionTypeDa2Enum.enum.FORM_FILLING,
        });

        expect(screen.getByTestId('forms-base-input')).toBeInTheDocument();

        expect(screen.queryByTestId('org-unit-input')).not.toBeInTheDocument();

        expect(screen.queryByTestId('entity-input')).not.toBeInTheDocument();
    });

    it('renders MissionOrgUnitTypeInput for ORG_UNIT_AND_FORM', () => {
        renderComponent({
            missionType: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        });

        expect(screen.getByTestId('org-unit-input')).toBeInTheDocument();

        expect(
            screen.queryByTestId('forms-base-input'),
        ).not.toBeInTheDocument();

        expect(screen.queryByTestId('entity-input')).not.toBeInTheDocument();
    });

    it('renders MissionEntityTypeInput for ENTITY_AND_FORM', () => {
        renderComponent({
            missionType: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
        });

        expect(screen.getByTestId('entity-input')).toBeInTheDocument();

        expect(
            screen.queryByTestId('forms-base-input'),
        ).not.toBeInTheDocument();

        expect(screen.queryByTestId('org-unit-input')).not.toBeInTheDocument();
    });

    it('resets dependent fields when mission type changes', () => {
        const { formik } = renderComponent();

        fireEvent.click(screen.getByTestId('mission-type-cards'));

        expect(formik.setFieldValue).toHaveBeenCalledWith('forms', []);
        expect(formik.setFieldTouched).toHaveBeenCalledWith('forms', false);

        expect(formik.setFieldValue).toHaveBeenCalledWith(
            'org_unit_type',
            undefined,
        );
        expect(formik.setFieldTouched).toHaveBeenCalledWith(
            'org_unit_type',
            false,
        );

        expect(formik.setFieldValue).toHaveBeenCalledWith(
            'entity_type',
            undefined,
        );
        expect(formik.setFieldTouched).toHaveBeenCalledWith(
            'entity_type',
            false,
        );

        expect(formik.setFieldValue).toHaveBeenCalledWith(
            'max_cardinality',
            undefined,
        );
        expect(formik.setFieldTouched).toHaveBeenCalledWith(
            'max_cardinality',
            false,
        );

        expect(formik.setFieldValue).toHaveBeenCalledWith('min_cardinality', 1);
        expect(formik.setFieldTouched).toHaveBeenCalledWith(
            'min_cardinality',
            false,
        );
    });
});
