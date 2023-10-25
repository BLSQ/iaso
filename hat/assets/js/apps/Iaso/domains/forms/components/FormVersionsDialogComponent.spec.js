import React from 'react';
import { act } from 'react-dom/test-utils';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { expect } from 'chai';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import FormVersionsDialog from './FormVersionsDialogComponent';
import PeriodPicker from '../../periods/components/PeriodPicker';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { renderWithStore } from '../../../../../test/utils/redux';
import formVersionFixture from '../fixtures/formVersions.json';
import { PERIOD_TYPE_DAY } from '../../periods/constants';
import MESSAGES from '../messages';

let connectedWrapper;

const requestsStub = require('../../../utils/requests');

const fakeFormVersion = formVersionFixture.form_versions[0];
const formId = 69;
let periodPicker;
let startPicker;
let endPicker;
let inputComponent;
let confirmCancelDialogComponent;
const awaitUseEffect = async wrapper => {
    await act(async () => {
        await Promise.resolve(wrapper);
        await new Promise(resolve => setImmediate(resolve));
        wrapper.update();
    });
    return Promise.resolve();
};

const getConnectedWrapper = () =>
    mount(
        renderWithStore(
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
                <FormVersionsDialog
                    formId={formId}
                    formVersion={fakeFormVersion}
                    titleMessage={MESSAGES.createFormVersion}
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            id="open-dialog"
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.createFormVersion}
                        />
                    )}
                    onConfirmed={() => null}
                    periodType={PERIOD_TYPE_DAY}
                />
            </LocalizationProvider>,
            {
                forms: {
                    current: undefined,
                },
            },
        ),
    );

describe('FormVersionsDialog connected component', () => {
    describe('with a new form version', () => {
        before(() => {
            connectedWrapper = mount(
                renderWithStore(
                    <FormVersionsDialog
                        formId={formId}
                        titleMessage={MESSAGES.createFormVersion}
                        onConfirmed={() => null}
                        periodType={PERIOD_TYPE_DAY}
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                id="open-dialog"
                                onClick={openDialog}
                                icon="edit"
                                tooltipMessage={MESSAGES.createFormVersion}
                            />
                        )}
                    />,
                    {
                        forms: {
                            current: undefined,
                        },
                    },
                ),
            );
            inputComponent = connectedWrapper.find('#open-dialog').at(0);
            inputComponent.props().onClick();
            connectedWrapper.update();
        });
        it('mount properly', () => {
            expect(connectedWrapper.exists()).to.equal(true);
        });
        describe('onConfirm', () => {
            it('should call createFormVersion', async () => {
                const newPeriod = '20200101';
                const picker = connectedWrapper.find(PeriodPicker).at(1);
                expect(picker).to.have.lengthOf(1);
                picker.props().onChange(newPeriod);
                await awaitUseEffect(connectedWrapper);
                const createFormVersionStub = sinon
                    .stub(requestsStub, 'createFormVersion')
                    .returns(new Promise(resolve => resolve({ id: 69 })));
                confirmCancelDialogComponent = connectedWrapper.find(
                    ConfirmCancelDialogComponent,
                );
                confirmCancelDialogComponent.props().onConfirm(() => null);
                expect(createFormVersionStub).to.have.been.called;
                sinon.restore();
            });
        });
    });

    describe('with a full form version', () => {
        before(() => {
            connectedWrapper = getConnectedWrapper();
            inputComponent = connectedWrapper.find('#open-dialog').at(0);
            inputComponent.props().onClick();
            connectedWrapper.update();
        });
        it('mount properly', () => {
            expect(connectedWrapper.exists()).to.equal(true);
        });
        it('should render 2 PeriodPicker', () => {
            periodPicker = connectedWrapper.find(PeriodPicker);
            expect(periodPicker).to.have.lengthOf(2);
        });
        it('Start PeriodPicker onChange should trigger setFieldValue', async () => {
            const newPeriod = '20200101';
            let picker = connectedWrapper.find(PeriodPicker).at(0);
            expect(picker).to.have.lengthOf(1);
            picker.props().onChange(newPeriod);
            await awaitUseEffect(connectedWrapper);
            picker = connectedWrapper.find(PeriodPicker).at(0);
            expect(picker.props().activePeriodString).to.equal(newPeriod);
        });
        it('End PeriodPicker onChange should trigger setFieldValue', async () => {
            const newPeriod = '20200101';
            let picker = connectedWrapper.find(PeriodPicker).at(1);
            expect(picker).to.have.lengthOf(1);
            picker.props().onChange(newPeriod);
            await awaitUseEffect(connectedWrapper);
            picker = connectedWrapper.find(PeriodPicker).at(1);
            expect(picker.props().activePeriodString).to.equal(newPeriod);
        });
        it('Should display an error if start is before end', async () => {
            const errorMessage = connectedWrapper.find('#chronological-error');
            expect(errorMessage.exists()).to.equal(true);
        });
        it('ConfirmCancelDialogComponent onCancel should change back form state', async () => {
            confirmCancelDialogComponent = connectedWrapper.find(
                ConfirmCancelDialogComponent,
            );
            expect(confirmCancelDialogComponent.exists()).to.equal(true);
            confirmCancelDialogComponent.props().onCancel(() => null);
            await awaitUseEffect(connectedWrapper);
            startPicker = connectedWrapper.find(PeriodPicker).at(0);
            expect(startPicker.props().activePeriodString).to.equal(
                fakeFormVersion.start_period,
            );
            endPicker = connectedWrapper.find(PeriodPicker).at(1);
            expect(endPicker.props().activePeriodString).to.equal(
                fakeFormVersion.end_period,
            );
        });
        it('Should display an error if start period is invalid', async () => {
            startPicker = connectedWrapper.find(PeriodPicker).at(0);
            startPicker.props().onChange('2020');
            await awaitUseEffect(connectedWrapper);
            const errorMessage = connectedWrapper.find('#start-invalid');
            expect(errorMessage.exists()).to.equal(true);
        });
        it('Should display an error if end period is invalid', async () => {
            endPicker = connectedWrapper.find(PeriodPicker).at(1);
            endPicker.props().onChange('2020');
            await awaitUseEffect(connectedWrapper);
            const errorMessage = connectedWrapper.find('#end-invalid');
            expect(errorMessage.exists()).to.equal(true);
        });

        describe('onConfirm', () => {
            before(() => {
                connectedWrapper = getConnectedWrapper();
                inputComponent = connectedWrapper.find('#open-dialog').at(0);
                inputComponent.props().onClick();
                connectedWrapper.update();
                confirmCancelDialogComponent = connectedWrapper.find(
                    ConfirmCancelDialogComponent,
                );
            });
            it('should call updateFormVersion without end period', async () => {
                startPicker = connectedWrapper.find(PeriodPicker).at(0);
                endPicker = connectedWrapper.find(PeriodPicker).at(1);
                startPicker.props().onChange('20200101');
                await awaitUseEffect(connectedWrapper);
                const updateFormVersionStub = sinon
                    .stub(requestsStub, 'updateFormVersion')
                    .returns(new Promise(resolve => resolve()));
                confirmCancelDialogComponent.props().onConfirm(() => null);
                expect(updateFormVersionStub).to.have.been.called;
                sinon.restore();
            });
            it('should call updateFormVersion with end period', async () => {
                endPicker.props().onChange('20200105');
                await awaitUseEffect(connectedWrapper);
                const updateFormVersionStub = sinon
                    .stub(requestsStub, 'updateFormVersion')
                    .returns(new Promise(resolve => resolve()));
                confirmCancelDialogComponent.props().onConfirm(() => null);
                expect(updateFormVersionStub).to.have.been.called;
                sinon.restore();
            });
            it('should fail silently if updateFormVersion fails with 400', async () => {
                endPicker.props().onChange('20200105');
                await awaitUseEffect(connectedWrapper);
                const updateFormVersionStub = sinon
                    .stub(requestsStub, 'updateFormVersion')
                    .returns(
                        new Promise((resolve, reject) =>
                            // eslint-disable-next-line prefer-promise-reject-errors
                            reject({
                                status: 400,
                                details: {
                                    xls_file: ['This list may not be empty.'],
                                },
                            }),
                        ),
                    );

                confirmCancelDialogComponent.props().onConfirm(() => null);
                expect(updateFormVersionStub).to.have.been.called;

                sinon.restore();
            });
            it('should fail silently if updateFormVersion fails with 500', async () => {
                const updateFormVersionStub = sinon
                    .stub(requestsStub, 'updateFormVersion')
                    .returns(
                        new Promise((resolve, reject) =>
                            // eslint-disable-next-line prefer-promise-reject-errors
                            reject({
                                status: 500,
                            }),
                        ),
                    );

                confirmCancelDialogComponent.props().onConfirm(() => null);
                expect(updateFormVersionStub).to.have.been.called;

                sinon.restore();
            });
        });
    });
});
