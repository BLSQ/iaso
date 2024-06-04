import React from 'react';

import App from './index.tsx';
import { renderWithStore } from '../../../../test/utils/redux';

describe('App', () => {
    it('render properly', () => {
        const wrapper = shallow(
            renderWithStore(<App plugins={[]} history={{}} />, {
                subscribe: () => null,
                dispatch: () => null,
                getState: () => null,
            }),
        );
        expect(wrapper.exists()).to.be.true;
    });
});
