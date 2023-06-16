import React from 'react';
import nock from 'nock';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { renderWithStore } from '../../../../../test/utils/redux';
import UsersDialog from './UsersDialog.tsx';
import MESSAGES from '../messages';
import { mockRequest } from '../../../../../test/utils/requests';
import { withQueryClientProvider } from '../../../../../test/utils';

let component;
let inputComponent;
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
        withQueryClientProvider(
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
                    saveProfile={() => null}
                />,
            ),
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
        mockRequest('get', '/api/permissions/', {
            permissions: [],
        });
        renderComponent();
    });
    describe('on mount', () => {
        it('mounts correctly', () => {
            expect(component.exists()).to.equal(true);
        });
    });
});
