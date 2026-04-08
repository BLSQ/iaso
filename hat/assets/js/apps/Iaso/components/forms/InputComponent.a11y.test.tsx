import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event/dist/cjs/index.js';
import { axe } from 'jest-axe';
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

describe('Phone InputComponent accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithTheme(
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

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
