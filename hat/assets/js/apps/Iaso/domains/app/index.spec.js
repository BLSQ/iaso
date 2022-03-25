import React from 'react';

import App from './index';

describe.only('App', () => {
    it('render properly', () => {
        const wrapper = shallow(
            <App
                store={{
                    subscribe: () => null,
                    dispatch: () => null,
                    getState: () => null,
                }}
                routes={[]}
                history={{}}
            />,
        );
        expect(wrapper.exists()).to.be.true;
    });
});
