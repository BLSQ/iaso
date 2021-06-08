import React from 'react';
import nock from 'nock';
import { renderWithStore } from '../../../../../test/utils/redux';
import UsersDialog from './UsersDialog';
import IconButtonComponent from '../../../components/buttons/IconButtonComponent';
import MESSAGES from '../messages';
import { mockRequest } from '../../../../../test/utils/requests';

let component;
let inputComponent;
const user = {
    id: 40,
    first_name: '',
    user_name: 'son',
    last_name: '',
    email: '',
    permissions: [],
    is_superuser: true,
    org_units: [],
    language: 'en',
};

const renderComponent = () => {
    component = mount(
        renderWithStore(
            <UsersDialog
                titleMessage={MESSAGES.updateUser}
                renderTrigger={({ openDialog }) => (
                    <IconButtonComponent
                        id="open-dialog"
                        onClick={openDialog}
                        icon="edit"
                        tooltipMessage={MESSAGES.edit}
                    />
                )}
                initialData={user}
                params={{}}
            />,
        ),
    );
    inputComponent = component.find('#open-dialog').at(0);
    inputComponent.props().onClick();
    component.update();
};

describe.only('UsersDialog', () => {
    beforeEach(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        renderComponent();
    });
    describe('on mount', () => {
        it('mounts correctly', () => {
            expect(component.exists()).to.equal(true);
        });
    });
    // TODO test the whole API request
    describe('When changing language setting', () => {
        before(() => {
            mockRequest('patch', '/api/profiles/40');
        });
        it('sends the new value to the backend', () => {
            const userInState = component.state('user');
            component.setState('user', { ...userInState, languae: 'fr' });
            component.instance().onConfirm();
        });
    });
});
