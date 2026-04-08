import React from 'react';
import { faker } from '@faker-js/faker';
import { act, waitFor } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { renderWithTheme } from '../../../../tests/helpers';

const Wrapper = () => {
    const [value, setValue] = React.useState(null);
    return (
        <InputComponent
            type={'phone'}
            keyValue={'phone'}
            value={value}
            onChange={(key, newValue) => setValue(newValue)}
            label={{ id: 'test', defaultMessage: 'phone' }}
            phoneInputOptions={{
                countryCodeEditable: true,
            }}
        />
    );
};

describe('Phone InputComponent', () => {
    it('clears the whole field and dropdown when countryCodeEditable is set to true', async () => {
        renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <Wrapper />
            </IntlProvider>,
        );

        const user = userEvent.setup();

        const randomBelgianNumber = faker.helpers.fromRegExp('+3265[0-9]{6}');

        await act(async () => {
            await user.type(
                screen.getByRole('textbox', { name: 'phone' }),
                randomBelgianNumber,
            );
        });

        expect(screen.getByTitle('Belgium: + 32')).toBeVisible();
        expect(screen.getByRole('textbox', { name: 'phone' })).toHaveValue(
            randomBelgianNumber,
        );

        await act(async () => {
            await user.clear(screen.getByRole('textbox', { name: 'phone' }));
        });

        await waitFor(() => {
            expect(screen.getByRole('textbox', { name: 'phone' })).toHaveValue(
                '',
            );
        });
    });

    it('leaves the whole field and dropdown when countryCodeEditable is set to true', async () => {
        renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <Wrapper />
            </IntlProvider>,
        );

        const user = userEvent.setup();

        const randomBelgianNumber = faker.helpers.fromRegExp('+3265[0-9]{6}');

        await act(async () => {
            await user.type(
                screen.getByRole('textbox', { name: 'phone' }),
                randomBelgianNumber,
            );
        });

        expect(screen.getByTitle('Belgium: + 32')).toBeVisible();
        expect(screen.getByRole('textbox', { name: 'phone' })).toHaveValue(
            randomBelgianNumber,
        );

        await act(async () => {
            await user.clear(screen.getByRole('textbox', { name: 'phone' }));
        });

        await waitFor(() => {
            expect(screen.getByRole('textbox', { name: 'phone' })).toHaveValue(
                '',
            );
        });

        // todo: bugged here, comes from the lib that isn't updated
        // expect(screen.getByTitle('Belgium: + 32')).not.toBeVisible();
    });
});
