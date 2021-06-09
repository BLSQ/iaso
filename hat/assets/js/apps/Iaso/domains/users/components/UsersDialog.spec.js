import React from 'react';
import nock from 'nock';
import { renderWithStore } from '../../../../../test/utils/redux';
import UsersDialog from './UsersDialog';
import IconButtonComponent from '../../../components/buttons/IconButtonComponent';
import MESSAGES from '../messages';
import { mockRequest } from '../../../../../test/utils/requests';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

let component;
let inputComponent;
let confirmCancelDialogComponent;
const user = {
    id: 47,
    first_name: '',
    user_name: 'Agent',
    last_name: '',
    email: '',
    password: '',
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

describe('UsersDialog', () => {
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
            mockRequest('patch', '/api/profiles/40', 'error', user);
        });
        it('sends the new value to the backend', () => {
            // const userInState = component.state('user');
            // component.setState('user', { ...userInState, languae: 'fr' });
            // component.instance().onConfirm();
            confirmCancelDialogComponent = component.find(
                ConfirmCancelDialogComponent,
            );
            confirmCancelDialogComponent.props().onConfirm(() => null);
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});
