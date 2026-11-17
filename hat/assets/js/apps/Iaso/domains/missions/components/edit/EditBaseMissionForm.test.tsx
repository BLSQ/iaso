import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionFormRetrieve } from 'Iaso/api/missions';
import { getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock } from 'Iaso/api/missions/endpoints/missions/missions.msw';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EditBaseMissionForm } from './EditBaseMissionForm';

const goBack = vi.fn();
const handleSubmit = vi.fn();

const formikState = {
    isValid: true,
    dirty: true,
    isSubmitting: false,
};

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
        useFormik: () =>
            ({
                values: {
                    name: 'Mission',
                    description: '',
                    forms: [],
                },
                errors: {},
                touched: {},
                status: undefined,
                handleSubmit,
                setFieldValue: vi.fn(),
                setFieldTouched: vi.fn(),
                get isValid() {
                    return formikState.isValid;
                },
                get dirty() {
                    return formikState.dirty;
                },
                get isSubmitting() {
                    return formikState.isSubmitting;
                },
            }) as unknown as FormikProps<any>,
        FormikProvider: ({ children }: any) => <>{children}</>,
    };
});

vi.mock('Iaso/domains/missions/components/EditMissionForm', () => ({
    EditMissionForm: () => <div data-testid="edit-mission-form" />,
}));

vi.mock('Iaso/domains/missions/components/DetailsWrapper', () => ({
    DetailsWrapper: ({ children, actions, title }: any) => (
        <div>
            <h1>{title}</h1>
            <div data-testid="actions">{actions}</div>
            {children}
        </div>
    ),
}));

const renderComponent = () => {
    const data =
        getApiMicroplanningMissionsRetrieveResponseMissionFormRetrieveTypedMock(
            {
                name: 'Mission',
            },
        ) as unknown as MissionFormRetrieve;

    renderWithThemeAndIntlProvider(
        <EditBaseMissionForm
            data={data}
            missionId={1}
            save={vi.fn()}
            goBack={goBack}
        />,
    );
};

describe('EditBaseMissionForm unit tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        formikState.isValid = true;
        formikState.dirty = true;
        formikState.isSubmitting = false;
    });

    it('clicking cancel calls goBack', () => {
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(goBack).toHaveBeenCalledTimes(1);
    });

    it('submit button is disabled when allowConfirm is false', () => {
        formikState.isValid = false;
        formikState.dirty = false;

        renderComponent();

        expect(
            screen.getByRole('button', {
                name: /save/i,
            }),
        ).toBeDisabled();
    });

    it('clicking submit calls formik.handleSubmit() when allowConfirm is true', () => {
        renderComponent();

        fireEvent.click(
            screen.getByRole('button', {
                name: /save/i,
            }),
        );

        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
});
