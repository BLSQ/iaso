import React from 'react';
import nock from 'nock';
import { expect } from 'chai';
import { AddTask } from './AddTaskComponent';
import IconButtonComponent from '../../../components/buttons/IconButtonComponent';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { mockPostRequest } from '../../../../../test/utils/requests';
import { renderWithStore } from '../../../../../test/utils/redux';
import { awaitUseEffect, fillFields } from '../../../../../test/utils';

const existingCredentials = {
    name: 'Goron',
    login: 'Daruk',
    url: '/api/divinebeast/vahnaboris',
};

const SOURCE_ID = 1;
const SOURCE_VERSION = 1;

let connectedWrapper;
let inputComponent;
let confirmCancelDialogComponent;

const renderWrapper = credentials => {
    connectedWrapper = mount(
        renderWithStore(
            <AddTask
                sourceId={SOURCE_ID}
                sourceVersion={SOURCE_VERSION}
                titleMessage={{ id: 'Title', defaultMessage: 'Title' }}
                onConfirmed={() => null}
                sourceCredentials={credentials}
                renderTrigger={({ openDialog }) => (
                    <IconButtonComponent
                        id="open-dialog"
                        onClick={openDialog}
                        icon="edit"
                        tooltipMessage={{
                            id: 'tooltip',
                            defaultMessage: 'tooltip',
                        }}
                    />
                )}
            />,
        ),
    );
    inputComponent = connectedWrapper.find('#open-dialog').at(0);
    inputComponent.props().onClick();
    connectedWrapper.update();
};
const credentialsFieldKeys = ['dhis2_url', 'dhis2_login', 'dhis2_password'];
const checkBoxesKeys = [
    {
        keyValue: 'continue_on_error',
        defaultValue: false,
    },
    {
        keyValue: 'validate_status',
        defaultValue: false,
    },
];
describe('AddTaskComponent', () => {
    describe('when credentials exist', () => {
        beforeEach(() => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockPostRequest('/api/dhis2ouimporter/', {});
            renderWrapper(existingCredentials);
            confirmCancelDialogComponent = connectedWrapper.find(
                ConfirmCancelDialogComponent,
            );
        });

        it('mounts correctly', () => {
            expect(connectedWrapper.exists()).to.equal(true);
        });

        it('onConfirm should submit form with source credentials', async () => {
            confirmCancelDialogComponent.props().onConfirm(() => null);
            await awaitUseEffect(connectedWrapper);
            await awaitUseEffect(connectedWrapper);
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });

        it('displays necessary fields when unselecting defaults', async () => {
            // First check that fields are not present
            credentialsFieldKeys.forEach(keyValue => {
                const element = connectedWrapper
                    .find(InputComponent)
                    .filter(`[keyValue="${keyValue}"]`);
                expect(element.exists()).to.equal(false);
            });
            // unselect use source creds
            const checkbox = connectedWrapper
                .find(InputComponent)
                .filter('[keyValue="change_source"]');
            expect(checkbox.exists()).to.equal(true);
            checkbox.props().onChange('change_source', false);
            await awaitUseEffect(connectedWrapper);
            // Check that fields are present with correct values
            credentialsFieldKeys.forEach(keyValue => {
                const element = connectedWrapper
                    .find(InputComponent)
                    .filter(`[keyValue="${keyValue}"]`);
                expect(element.exists()).to.equal(true);
            });
        });

        it('allow confirm should be true if all fields are filled', async () => {
            // TODO extract logic
            const checkbox = connectedWrapper
                .find(InputComponent)
                .filter('[keyValue="change_source"]');
            checkbox.props().onChange('change_source', false);
            connectedWrapper.update();
            await fillFields(connectedWrapper, credentialsFieldKeys);
            await awaitUseEffect(connectedWrapper);
            expect(confirmCancelDialogComponent.exists()).to.equal(true);
            expect(confirmCancelDialogComponent.props().allowConfirm).to.equal(
                true,
            );
        });

        it('onChange on checkBoxes change their values', () => {
            // for each checkbox in array
            checkBoxesKeys.forEach(async c => {
                let checkbox = connectedWrapper
                    .find(InputComponent)
                    .filter(`[keyValue="${c.keyValue}"]`);
                expect(checkbox.exists()).to.equal(true);
                // Check original value
                expect(checkbox.props().value).to.equal(c.defaultValue);
                // Change the value
                checkbox.props().onChange(c.keyValue, true);
                connectedWrapper.update();
                checkbox = connectedWrapper
                    .find(InputComponent)
                    .filter(`[keyValue="${c.keyValue}"]`);
                // Check the newValue
                expect(checkbox.props().value).to.equal(!c.defaultValue);
            });
        });

        it('onConfirm should submit form', async () => {
            let checkbox = connectedWrapper
                .find(InputComponent)
                .filter('[keyValue="change_source"]');
            checkbox.props().onChange('change_source', false);
            await awaitUseEffect(connectedWrapper);
            checkbox = connectedWrapper
                .find(InputComponent)
                .filter('[keyValue="change_source"]');
            expect(checkbox.props().value).to.equal(false);
            await fillFields(connectedWrapper, credentialsFieldKeys);
            await awaitUseEffect(connectedWrapper);
            confirmCancelDialogComponent = connectedWrapper.find(
                ConfirmCancelDialogComponent,
            );
            confirmCancelDialogComponent.props().onConfirm(() => null);
            await awaitUseEffect(connectedWrapper);
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });

        it('onRedirect should submit form', async () => {
            confirmCancelDialogComponent = connectedWrapper.find(
                ConfirmCancelDialogComponent,
            );
            const closeDialogSpy = sinon.spy();
            confirmCancelDialogComponent
                .props()
                .onAdditionalButtonClick(() => closeDialogSpy());
            await awaitUseEffect(connectedWrapper);
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
    describe("when credentials don't exist", () => {
        it('mounts correctly', () => {
            renderWrapper();
            expect(connectedWrapper.exists()).to.equal(true);
        });
    });
});
