import { PasswordInput, Select } from 'bluesquare-components';
import { expect } from 'chai';
import React from 'react';
import { withQueryClientProvider } from '../../../../../test/utils';
import { renderWithIntl } from '../../../../../test/utils/intl';
import { renderWithMuiTheme } from '../../../../../test/utils/muiTheme';
import MESSAGES from '../messages';
import UsersInfos from './UsersInfos';

let component;
let inputs;
const setFieldValue = sinon.spy();
const currentUser = {
    id: 47,
    first_name: { value: '', errors: [] },
    user_name: { value: 'Agent', errors: [] },
    last_name: { value: '', errors: [] },
    email: { value: '', errors: [] },
    password: { value: '1234', errors: [] },
    permissions: [],
    is_superuser: true,
    org_units: [],
    language: { value: 'fr', errors: [] },
    dhis2_id: '1',
    home_page: '/settings/users/management',
    projects: [1],
    user_roles: [1],
    has_multiple_accounts: { value: false },
};

const renderComponent = initialData => {
    component = mount(
        renderWithIntl(
            renderWithMuiTheme(
                withQueryClientProvider(
                    <UsersInfos
                        currentUser={currentUser}
                        setFieldValue={setFieldValue}
                        initialData={initialData}
                    />,
                ),
            ),
        ),
    );
};

describe('UsersInfos', () => {
    beforeEach(() => {
        renderComponent();
        component.update();
        inputs = component.find('input');
        setFieldValue.resetHistory();
    });
    it('renders', () => {
        expect(component.exists()).to.equal(true);
    });
    it('triggers callback onChange in text fields', () => {
        // Ignore the Select field which has different behaviour
        for (let i = 0; i < inputs.length - 1; i += 1) {
            const input = component.find('input').at(i);
            input.simulate('change', {
                target: { value: 'en' },
            });
        }
        expect(setFieldValue.getCalls().length).to.equal(8);
    });
    it('triggerd callback when changing language', () => {
        const select = component.find(Select).at(0);
        select.props().onChange();
        expect(setFieldValue).to.have.been.calledOnce;
    });
    it('displays "new password" message if initialData is set and not empty', () => {
        renderComponent({ notEmpty: true });
        const password = component.find(PasswordInput).at(0);
        expect(password.props().label).to.equal(
            MESSAGES.newPassword.defaultMessage,
        );
    });

    it('displays "new password" message if initialData is set but empty', () => {
        renderComponent({});
        const password = component.find(PasswordInput).at(0);
        expect(password.props().label).to.equal(
            MESSAGES.password.defaultMessage,
        );
    });
});
