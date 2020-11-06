import React from 'react';

import ConnectedFormsDialog, {
    FormDialogComponent,
} from './FormDialogComponent';
import { renderWithStore } from '../../../../../test/utils/redux';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import {
    mockPutRequest,
    mockDeleteRequest,
    mockPostRequest,
    mockPutRequest2,
} from '../../../../../test/utils/requests';

const actions = require('../actions');

let wrapper;
let instance;
let confirmCancelDialogComponent;
let setIsLoadingFormStub;
let timer;

const fieldsList = [
    'name',
    'xls_file',
    'periods_before_allowed',
    'periods_after_allowed',
    'single_per_period',
    'location_field',
    'derived',
    'device_field',
];
const commaSeparatedFieldsList = ['project_ids', 'org_unit_type_ids'];
const defaultProps = {
    dispatch: arg => arg,
    projects: [
        {
            id: 1,
            name: 'Hyrule warriors',
        },
    ],
    orgUnitTypes: [
        {
            id: 1,
            name: 'Gorons',
        },
    ],
    onSuccess: () => null,
    renderTrigger: () => null,
    titleMessage: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
};
const initialState = {
    id: { value: null, errors: [] },
    name: { value: '', errors: [] },
    xls_file: { value: null, errors: [] },
    project_ids: { value: [1], errors: [] },
    org_unit_type_ids: { value: [1], errors: [] },
    period_type: { value: null, errors: [] },
    derived: { value: false, errors: [] },
    single_per_period: { value: false, errors: [] },
    periods_before_allowed: { value: 0, errors: [] },
    periods_after_allowed: { value: 0, errors: [] },
    device_field: { value: 'deviceid', errors: [] },
    location_field: { value: '', errors: [] },
};

describe('FormDialogComponent', () => {
    afterEach(() => {
        sinon.restore();
    });
    it('connected component mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<ConnectedFormsDialog {...defaultProps} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });
    describe('pure component', () => {
        it('mount properly', () => {
            wrapper = shallow(<FormDialogComponent {...defaultProps} />);
            expect(wrapper.exists()).to.equal(true);
        });
        it('mount with initialData should set state with initialData', () => {
            wrapper = shallow(
                <FormDialogComponent
                    {...defaultProps}
                    initialData={{
                        id: null,
                        name: '',
                        xls_file: null,
                        period_type: null,
                        derived: false,
                        single_per_period: false,
                        periods_before_allowed: 0,
                        periods_after_allowed: 0,
                        device_field: 'deviceid',
                        location_field: '',
                        org_unit_types: [
                            {
                                id: 1,
                            },
                        ],
                        projects: [
                            {
                                id: 1,
                            },
                        ],
                    }}
                />,
            );
            instance = wrapper.instance();
            expect(instance.state).to.eql(initialState);
        });
        it('setFieldErrors should update state with error', () => {
            const error = 'Zelda is not a the girl !';
            const expectedState = {
                ...initialState,
                name: { value: '', errors: [error] },
            };
            instance.setFieldErrors('name', [error]);
            expect(instance.state).to.eql(expectedState);
        });
        it('setFieldValue should update state with value and reset errors', () => {
            const expectedState = {
                ...initialState,
                name: { value: 'Zelda', errors: [] },
            };
            instance.setFieldValue('name', 'Zelda');
            expect(instance.state).to.eql(expectedState);
        });
        it('setPeriodType with a value should update state', () => {
            const periodType = 'periodType';
            instance.setState({ ...initialState });
            const expectedState = {
                ...initialState,
                period_type: { value: periodType, errors: [] },
                periods_before_allowed: { value: 3, errors: [] },
                periods_after_allowed: { value: 3, errors: [] },
            };
            instance.setPeriodType(periodType);
            expect(instance.state).to.eql(expectedState);
        });

        it('setPeriodType without a value should reset state', () => {
            instance.setPeriodType(null);
            expect(instance.state).to.eql(initialState);
        });

        it('ConfirmCancelDialogComponent onClosed should reset state', () => {
            confirmCancelDialogComponent = wrapper.find(
                ConfirmCancelDialogComponent,
            );
            instance.setState({
                ...initialState,
                name: { value: 'Zelda', errors: [] },
            });
            confirmCancelDialogComponent.props().onClosed();
            expect(instance.state).to.eql(initialState);
        });

        it('ConfirmCancelDialogComponent onConfirm should call component onConfirm method', () => {
            const onConfirmStub = sinon.stub(instance, 'onConfirm');
            const arg = 'argument';
            confirmCancelDialogComponent.props().onConfirm(arg);
            expect(onConfirmStub).to.have.been.calledOnce;
            expect(onConfirmStub).to.have.been.calledWith(arg);
        });

        describe('form field ', () => {
            fieldsList.forEach(field => {
                it(`${field} onChange should set state ${field} value`, () => {
                    instance.setState({ ...initialState });
                    const inputComponent = wrapper.find(
                        `[keyValue="${field}"]`,
                    );
                    const value = 'Zelda';
                    inputComponent.props().onChange(field, value);
                    const expectedState = {
                        ...initialState,
                        [field]: { value, errors: [] },
                    };
                    expect(instance.state).to.eql(expectedState);
                });
            });
            commaSeparatedFieldsList.forEach(field => {
                it(`${field} onChange should set state ${field} value to commaSeparatedIdsToArray value`, () => {
                    instance.setState({ ...initialState });
                    const inputComponent = wrapper.find(
                        `[keyValue="${field}"]`,
                    );
                    const value = 'Zelda';
                    inputComponent.props().onChange(field, value);
                    const expectedState = {
                        ...initialState,
                        [field]: {
                            value: commaSeparatedIdsToArray(value),
                            errors: [],
                        },
                    };
                    expect(instance.state).to.eql(expectedState);
                });
            });

            it('period_type onChange should trigger setPeriodType', () => {
                instance.setState({ ...initialState });
                const setPeriodTypeStub = sinon.stub(instance, 'setPeriodType');
                const inputComponent = wrapper.find('[keyValue="period_type"]');
                const value = 'Zelda again';
                inputComponent.props().onChange('period_type', value);
                expect(setPeriodTypeStub).to.have.been.calledOnce;
                expect(setPeriodTypeStub).to.have.been.calledWith(value);
            });
        });
        describe('onConfirm method', () => {
            before(() => {
                setIsLoadingFormStub = sinon.stub(actions, 'setIsLoadingForm');
            });
            it('should trigger setIsLoadingForm action', () => {
                instance.setState({
                    ...initialState,
                    id: { value: 1, errors: [] },
                });
                mockPutRequest('/api/forms/1/');
                instance.onConfirm();
                expect(setIsLoadingFormStub).to.have.been.called;
            });

            // it('should call closeDialog on success', () => {
            //     const closeDialogSpy = sinon.spy();
            //     const fakeCloseDialog = () => {
            //         closeDialogSpy();
            //     };
            //     mockPutRequest2('/api/forms/1/', () => {
            //         timer = setTimeout(() => {
            //             expect(closeDialogSpy).to.have.been.calledOnce;
            //             nock.cleanAll();
            //         }, 10);
            //     });
            //     instance.onConfirm(fakeCloseDialog);
            // });

            it('should call update api url', () => {
                const callBackSpy = sinon.spy();
                mockPutRequest('/api/forms/1/', [], () => callBackSpy());
                instance.onConfirm();
                expect(callBackSpy).to.have.been.calledOnce;
            });
            it('should call createFormVersion if xls_file and isUpdate', () => {
                instance.setState({
                    ...instance.state,
                    xls_file: { value: ['ocarina of time'], errors: [] },
                });
                const callBackSpy = sinon.spy();
                mockPutRequest('/api/forms/1/');
                mockPostRequest('/api/formversions/', [], () => callBackSpy());
                instance.onConfirm();
                expect(callBackSpy).to.have.been.calledOnce;
            });
            it('should call create api url if no initial data', () => {
                wrapper = shallow(<FormDialogComponent {...defaultProps} />);
                instance = wrapper.instance();
                const callBackSpy = sinon.spy();
                mockPostRequest('/api/forms/', [], () => callBackSpy());
                instance.onConfirm();
                expect(callBackSpy).to.have.been.calledOnce;
            });

            // after(() => {
            //     clearTimeout(timer);
            // });

            // it('should call deleteForm if createFormVersion error and not isUpdate', () => {
            //     wrapper = shallow(<FormDialogComponent {...defaultProps} />);
            //     instance = wrapper.instance();
            //     instance.setState({
            //         ...initialState,
            //         xls_file: { value: ['ocarina of time'], errors: [] },
            //     });
            //     const deleteCallBackSpy = sinon.spy();
            //     mockPostRequest('/api/forms/1/');
            //     mockPostRequest('/api/formversions/', [], () => null, true);
            //     mockDeleteRequest('/api/forms/1/', [], () =>
            //         deleteCallBackSpy(),
            //     );
            //     instance.onConfirm();
            //     expect(deleteCallBackSpy).to.have.been.calledOnce;
            //     nock.cleanAll();
            // });
        });
    });
});
