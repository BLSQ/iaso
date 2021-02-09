import React from 'react';
import nock from 'nock';
// import { Provider, connect } from 'react-redux';
// import { defineMessages, injectIntl } from 'react-intl';

// import { shallow } from 'enzyme';
import Forms from './index';
import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
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
        url: '/api/forms/?&all=true&limit=10&page=1&order=-created_at',
        body: {
            forms: [],
        },
    },
];

let connectedWrapper;

// const mock = require('mock-require');

describe('Forms connected component', () => {
    before(() => {
        nock.cleanAll();
        nock.abortPendingRequests();
        mockGetRequestsList(requests);

        // mock.stop('react-redux');
        // mock.stop('react-intl');
        // mock('react-redux', {
        //     connect,
        //     useSelector: () => console.log('useSelector'),
        //     useDispatch: () => console.log('useDispatch'),
        // });
        // mock('react-intl', {
        //     defineMessages,
        //     injectIntl,
        //     useIntl: () => ({
        //         intl: {
        //             formatMessage: () => null,
        //         },
        //     }),
        // });
    });

    it('mount properly', () => {
        connectedWrapper = mount(renderWithStore(<Forms params={{}} />));
        // const forms = connectedWrapper.find(Forms);
        // console.log('connectedWrapper', forms);
        expect(connectedWrapper.exists()).to.equal(true);
    });

    it('render TopBar', () => {
        expect(connectedWrapper.find(TopBar)).to.have.lengthOf(1);
    });

    it('render SingleTable', () => {
        const singleTable = connectedWrapper.find(SingleTable);
        // console.log('singleTable', singleTable);
        // console.log('singleTable', singleTable.instance().props.hideGpkg);
        expect(singleTable).to.have.lengthOf(1);
    });

    describe('should connect to api', () => {
        it('and call forms api', () => {
            expect(nock.activeMocks()).to.have.lengthOf(0);
        });
    });
    // after(() => {
    //     mock.stop('react-redux');
    //     mock.stop('react-intl');
    // });
});

// it('should update on success', () => {
//     expect(instance.state.isUpdated).to.equal(false);
//     const formDialogComponent = wrapperForm.find(FormDialogComponent);
//     formDialogComponent.props().onSuccess();
//     wrapperForm.update();
//     expect(instance.state.isUpdated).to.equal(true);
// });

// it('getExportUrl without exportTypes should return csv by default', () => {
//     expect(instance.getExportUrl()).to.equal('/api/forms/?&csv=true');
// });

// it('should not display loader if not loading', () => {
//     expect(wrapperForm.find(LoadingSpinner)).to.have.lengthOf(0);
// });

// it('should display loading spinner if loading', () => {
//     wrapperForm = shallow(<Forms {...defaultProps} isLoading />);
//     expect(wrapperForm.find(LoadingSpinner)).to.have.lengthOf(1);
// });
// it('should display DownloadButtonsComponent if forms list ins not null', () => {
//     expect(wrapperForm.find(DownloadButtonsComponent)).to.have.lengthOf(1);
// });
// it('render TopBar', () => {
//     expect(wrapperForm.find(TopBar)).to.have.lengthOf(1);
// });

// it('render FormDialogComponent', () => {
//     expect(wrapperForm.find(FormDialogComponent)).to.have.lengthOf(1);
// });
