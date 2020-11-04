import React from 'react';

import FormDialogComponent from './FormDialogComponent';
import { renderWithStore } from '../../../../../test/utils/redux';

let wrapper;

describe('FormDialogComponent', () => {
    it('connected component mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(
                <FormDialogComponent params={{}} renderTrigger={() => null} />,
            ),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });
    // describe('pure component', () => {
    //     it('mount properly', () => {
    //         wrapper = shallow(FormDialogComponent);
    //         expect(wrapper.exists()).to.equal(true);
    //     });
    // });
});
