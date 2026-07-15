import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionTypeDropdownValueEnum } from 'Iaso/api/missions';

import { CreateMissionForm } from './CreateMissionForm';

const linkButtonSpy = vi.fn();

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');

    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (message: any) =>
                message.defaultMessage ?? message.id ?? '',
        }),
        LinkButton: (props: any) => {
            linkButtonSpy(props);
            return <a href={props.to}>{props.children}</a>;
        },
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

vi.mock('Iaso/domains/missions/components/MissionTypeDropdownInput', () => ({
    MissionTypeDropdownInput: (props: any) => {
        missionTypeDropdownSpy(props);

        return (
            <button
                data-testid="mission-type-dropdown"
                onClick={() =>
                    props.onChange(
                        'mission_type',
                        MissionTypeDropdownValueEnum.enum.FORM_FILLING,
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
    cancelUrl?: string;
    allowConfirm?: boolean;
};

const renderComponent = ({
    missionType,
    cancelUrl,
    allowConfirm = true,
}: RenderProps = {}) => {
    const formik = createFormik(missionType);

    render(
        <CreateMissionForm
            formik={formik}
            cancelUrl={cancelUrl}
            allowConfirm={allowConfirm}
            successButtonMessage="Save"
        />,
    );

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

        expect(screen.getByTestId('mission-type-dropdown')).toBeInTheDocument();
    });

    it('shows the info alert when no mission type is selected', () => {
        renderComponent();

        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders MissionFormsBaseInput for FORM_FILLING', () => {
        renderComponent({
            missionType: MissionTypeDropdownValueEnum.enum.FORM_FILLING,
        });

        expect(screen.getByTestId('forms-base-input')).toBeInTheDocument();

        expect(screen.queryByTestId('org-unit-input')).not.toBeInTheDocument();

        expect(screen.queryByTestId('entity-input')).not.toBeInTheDocument();
    });

    it('renders MissionOrgUnitTypeInput for ORG_UNIT_AND_FORM', () => {
        renderComponent({
            missionType: MissionTypeDropdownValueEnum.enum.ORG_UNIT_AND_FORM,
        });

        expect(screen.getByTestId('org-unit-input')).toBeInTheDocument();

        expect(
            screen.queryByTestId('forms-base-input'),
        ).not.toBeInTheDocument();

        expect(screen.queryByTestId('entity-input')).not.toBeInTheDocument();
    });

    it('renders MissionEntityTypeInput for ENTITY_AND_FORM', () => {
        renderComponent({
            missionType: MissionTypeDropdownValueEnum.enum.ENTITY_AND_FORM,
        });

        expect(screen.getByTestId('entity-input')).toBeInTheDocument();

        expect(
            screen.queryByTestId('forms-base-input'),
        ).not.toBeInTheDocument();

        expect(screen.queryByTestId('org-unit-input')).not.toBeInTheDocument();
    });

    it('resets dependent fields when mission type changes', () => {
        const { formik } = renderComponent();

        fireEvent.click(screen.getByTestId('mission-type-dropdown'));

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

    it('renders the cancel button when cancelUrl is provided', () => {
        renderComponent({
            cancelUrl: '/missions',
        });

        expect(screen.getByRole('link')).toHaveAttribute('href', '/missions');
    });

    it('does not render cancel button if cancelUrl is not provided', () => {
        renderComponent();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('disables submit when allowConfirm is false', () => {
        renderComponent({
            allowConfirm: false,
        });

        expect(
            screen.getByRole('button', {
                name: 'Save',
            }),
        ).toBeDisabled();
    });

    it('calls handleSubmit when submit is clicked', () => {
        const { formik } = renderComponent();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save',
            }),
        );

        expect(formik.handleSubmit).toHaveBeenCalledTimes(1);
    });
});
