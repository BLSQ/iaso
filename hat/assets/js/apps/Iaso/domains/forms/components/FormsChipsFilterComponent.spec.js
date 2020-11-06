import React from 'react';

import ConnectedFormsChipsFilterComponent, {
    FormsChipsFilterComponent,
} from './FormsChipsFilterComponent';
import { renderWithStore } from '../../../../../test/utils/redux';
import ChipsFilterComponent from '../../../components/filters/chips/ChipsFilterComponent';
import { mockGetRequest } from '../../../../../test/utils/requests';
import { orgUnitsInitialState } from '../../orgUnits/reducer';

const actions = require('../../orgUnits/actions');

let connectedWrapper;
let formsChipsFilterComponent;
let chipsFilterComponent;
let setFormsSelectedStub;

const defaultProps = {
    classes: {},
    formsSelected: {
        id: 1,
    },
    currentForms: [[{ id: 1 }]],
    dispatch: arg => arg,
    currentOrgUnit: {
        id: 1,
    },
    fitToBounds: () => null,
};
describe('FormsChipsFilterComponent', () => {
    before(() => {
        setFormsSelectedStub = sinon.stub(actions, 'setFormsSelected').returns({
            type: 'TRUX',
            payload: '',
        });
    });
    it('connected component mount properly', () => {
        connectedWrapper = mount(
            renderWithStore(
                <ConnectedFormsChipsFilterComponent {...defaultProps} />,
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    it('should call setFormsSelected if trigger component props setFormsSelected', () => {
        formsChipsFilterComponent = connectedWrapper
            .find(FormsChipsFilterComponent)
            .props();
        formsChipsFilterComponent.setFormsSelected();
        expect(setFormsSelectedStub).to.have.been.called;
    });

    it('fetchDetails props should call fetchInstancesAsLocationsByForm', () => {
        const form = {
            id: 1,
        };
        const callBackSpy = sinon.spy();
        connectedWrapper = mount(
            renderWithStore(
                <ConnectedFormsChipsFilterComponent {...defaultProps} />,
                {
                    orgUnits: {
                        ...orgUnitsInitialState,
                        current: { id: 1 },
                    },
                },
            ),
        );
        mockGetRequest(
            `/api/instances?as_location=true&form_id=${form.id}&orgUnitId=1`,
            [],
            () => callBackSpy(),
        );
        chipsFilterComponent = connectedWrapper.find(ChipsFilterComponent);
        chipsFilterComponent.props().fetchDetails(form);
        expect(callBackSpy).to.have.been.calledOnce;
    });

    it('pure component mount properly', () => {
        const wrapper = shallow(
            <FormsChipsFilterComponent {...defaultProps} />,
        );
        expect(wrapper.exists()).to.equal(true);
    });
});
