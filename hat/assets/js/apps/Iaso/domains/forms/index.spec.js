import React from 'react';

import Forms from './index';
import TopBar from '../../components/nav/TopBarComponent';
import CustomTableComponent from '../../components/CustomTableComponent';
import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import FormDialogComponent from './components/FormDialogComponent';
import { renderWithStore } from '../../../../test/utils/redux';
import { mockGetRequest } from '../../../../test/utils/requests';
import { formsInitialState } from './reducer';

const formsSpy = sinon.spy();
const projectsSpy = sinon.spy();
const orgUnitTypesSpy = sinon.spy();
let wrapper;
mockGetRequest(
    '/api/projects/',
    {
        projects: [],
    },
    projectsSpy(),
);
mockGetRequest(
    '/api/orgunittypes/',
    {
        orgUnitTypes: [],
    },
    orgUnitTypesSpy(),
);
mockGetRequest(
    '/api/forms/?all=true&order=instance_updated_at&limit=50&page=1',
    {
        forms: [],
    },
    formsSpy(),
);
describe('Forms list page', () => {
    it('mount properly', () => {
        wrapper = mount(renderWithStore(<Forms params={{}} />));
        expect(wrapper.exists()).to.equal(true);
    });
    it('render TopBar', () => {
        expect(wrapper.find(TopBar)).to.have.lengthOf(1);
    });

    it('render CustomTableComponent', () => {
        expect(wrapper.find(CustomTableComponent)).to.have.lengthOf(1);
    });

    it('render FormDialogComponent', () => {
        expect(wrapper.find(FormDialogComponent)).to.have.lengthOf(1);
    });
    describe('should connect to api', () => {
        it('and call forms api', () => {
            expect(formsSpy).to.have.been.calledOnce;
        });
        it('and call projects api', () => {
            expect(projectsSpy).to.have.been.calledOnce;
        });
        it('and call org unit type api', () => {
            expect(orgUnitTypesSpy).to.have.been.calledOnce;
        });
    });

    it('render DownloadButtonsComponent if forms results', () => {
        wrapper.update();
        // wrapper = mount(
        //     renderWithStore(<Forms params={{}} />, {
        //         forms: {
        //             ...formsInitialState,
        //             formsPage: {
        //                 list: [],
        //                 showPagination: false,
        //                 params: {},
        //                 count: 0,
        //                 pages: 0,
        //             },
        //         },
        //     }),
        // );
        expect(wrapper.find(DownloadButtonsComponent)).to.have.lengthOf(1);
    });
});
