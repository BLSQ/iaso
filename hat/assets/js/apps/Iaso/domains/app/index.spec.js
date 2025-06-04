import React from 'react';

import { renderWithIntl } from '../../../../test/utils/intl';
import { renderWithMuiTheme } from '../../../../test/utils/muiTheme';
import App from './index.tsx';

describe('App', () => {
    it('render properly', () => {
        const wrapper = shallow(
            renderWithMuiTheme(
                renderWithIntl(<App plugins={[]} history={{}} />),
            ),
        );
        expect(wrapper.exists()).to.be.true;
    });
});
