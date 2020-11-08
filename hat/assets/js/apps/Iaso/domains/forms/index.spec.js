import React from 'react';
import nock from 'nock';

import ConnectedForms, { Forms } from './index';
import TopBar from '../../components/nav/TopBarComponent';
import CustomTableComponent from '../../components/CustomTableComponent';
import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import FormDialogComponent from './components/FormDialogComponent';
import { renderWithStore } from '../../../../test/utils/redux';
import { mockGetRequestsList } from '../../../../test/utils/requests';

const requests = [
    {
        url: '/api/projects/',
        body: {
            projects: [],
        },
    },
    {
        url: '/api/orgunittypes/',
        body: {
            orgUnitTypes: [],
        },
    },
    {
        url: '/api/forms/?all=true&order=instance_updated_at&limit=50&page=1',
        body: {
            forms: [],
        },
    },
];

describe('Forms connected component', () => {
    before(() => mockGetRequestsList(requests));

    it('mount properly', () => {
        const connectedWrapper = mount(
            renderWithStore(<ConnectedForms params={{}} />),
        );
        expect(connectedWrapper.exists()).to.equal(true);
    });

    describe('should connect to api', () => {
        it('and call forms api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
});

const defaultProps = {
    isLoading: false,
    classes: {
        containerFullHeightNoTabPadded: '',
        marginTop: '',
        reactTable: '',
    },
    setForms: () => null,
    fetchAllProjects: () => null,
    fetchAllOrgUnitTypes: () => null,
    params: {},
    intl: { formatMessage: () => null },
    reduxPage: { list: [] },
};
let wrapperForm;
let instance;

describe('Forms pure component', () => {
    before(() => mockGetRequestsList(requests));
    it('mount properly', () => {
        wrapperForm = shallow(<Forms {...defaultProps} />);
        instance = wrapperForm.instance();
    });
    it('should update on success', () => {
        expect(instance.state.isUpdated).to.equal(false);
        const formDialogComponent = wrapperForm.find(FormDialogComponent);
        formDialogComponent.props().onSuccess();
        wrapperForm.update();
        expect(instance.state.isUpdated).to.equal(true);
    });

    it('getExportUrl without exportTypes should return csv by default', () => {
        expect(instance.getExportUrl()).to.equal('/api/forms/?&csv=true');
    });

    it('should not display loader if not loading', () => {
        expect(wrapperForm.find(LoadingSpinner)).to.have.lengthOf(0);
    });

    it('should display loading spinner if loading', () => {
        wrapperForm = shallow(<Forms {...defaultProps} isLoading />);
        expect(wrapperForm.find(LoadingSpinner)).to.have.lengthOf(1);
    });
    it('should display DownloadButtonsComponent if forms list ins not null', () => {
        expect(wrapperForm.find(DownloadButtonsComponent)).to.have.lengthOf(1);
    });
    it('render TopBar', () => {
        expect(wrapperForm.find(TopBar)).to.have.lengthOf(1);
    });

    it('render CustomTableComponent', () => {
        expect(wrapperForm.find(CustomTableComponent)).to.have.lengthOf(1);
    });

    it('render FormDialogComponent', () => {
        expect(wrapperForm.find(FormDialogComponent)).to.have.lengthOf(1);
    });
});
