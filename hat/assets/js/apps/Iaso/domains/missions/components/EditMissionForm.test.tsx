import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionTypeDropdownValueEnum } from 'Iaso/api/missions';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { EditMissionForm } from './EditMissionForm';

const linkButtonMock = vi.fn();

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');

    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (message: any) =>
                message.defaultMessage ?? message.id,
        }),
        LinkButton: (props: any) => {
            linkButtonMock(props);
            return <a href={props.to}>{props.children}</a>;
        },
    };
});

vi.mock('formik', async () => {
    const actual = await vi.importActual<typeof import('formik')>('formik');

    return {
        ...actual,
        Field: ({ name }: any) => <div data-testid={`field-${name}`} />,
    };
});

vi.mock('Iaso/components/papers/WidgetPaperComponent', () => ({
    default: ({ children }: any) => <div>{children}</div>,
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

const createFormik = (): FormikProps<any> =>
    ({
        handleSubmit: vi.fn(),
    }) as unknown as FormikProps<any>;

type Props = {
    missionType?: React.ComponentProps<typeof EditMissionForm>['missionType'];
    cancelUrl?: string;
    allowConfirm?: boolean;
};

const renderComponent = ({
    missionType = MissionTypeDropdownValueEnum.enum.FORM_FILLING,
    cancelUrl,
    allowConfirm = true,
}: Props = {}) => {
    const formik = createFormik();

    renderWithThemeAndIntlProvider(
        <EditMissionForm
            missionType={missionType}
            formik={formik}
            allowConfirm={allowConfirm}
            cancelUrl={cancelUrl}
            successButtonMessage="Save"
        />,
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

    it('renders the cancel button only when cancelUrl is provided, with the correct to prop', () => {
        renderComponent({
            cancelUrl: '/missions',
        });

        expect(linkButtonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: '/missions',
            }),
        );

        expect(screen.getByRole('link')).toBeInTheDocument();

        vi.clearAllMocks();

        renderComponent();

        expect(linkButtonMock).not.toHaveBeenCalled();
    });

    it('submit button is disabled when allowConfirm is false', () => {
        renderComponent({
            allowConfirm: false,
        });

        expect(
            screen.getByRole('button', {
                name: 'Save',
            }),
        ).toBeDisabled();
    });

    it('clicking submit calls formik.handleSubmit() when allowConfirm is true', () => {
        const { formik } = renderComponent({
            allowConfirm: true,
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save',
            }),
        );

        expect(formik.handleSubmit).toHaveBeenCalledTimes(1);
    });
});
