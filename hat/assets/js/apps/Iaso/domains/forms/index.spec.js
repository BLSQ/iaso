import React from 'react';

import Forms from './index';
import TopBar from '../../components/nav/TopBarComponent';

describe('Forms list page', () => {
    it('render properly', () => {
        const wrapper = shallow(<Forms />);
        expect(wrapper.exists()).to.equal(true);
    });
    it('render properly TopBar', () => {
        const wrapper = mount(<Forms />);
        expect(wrapper.find(TopBar)).to.have.lengthOf(1);
    });
});
