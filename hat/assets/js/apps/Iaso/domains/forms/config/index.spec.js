import { IconButton } from 'bluesquare-components';
import { expect } from 'chai';
import formsTableColumns, { formVersionsTableColumns } from '.';
import FormVersionsDialog from '../components/FormVersionsDialogComponent';

import formsFixture from '../fixtures/forms.json';
import formVersionsfixture from '../fixtures/formVersions.json';

import { colOriginal } from '../../../../../test/utils';

let columns;
let formVersionscolumns;
const fakeForm = formsFixture.forms[0];
const fakeFormVersion = formVersionsfixture.form_versions[0];
let wrapper;
let xlsButton;
let actionColumn;
let formVersionsDialog;
const setForceRefreshSpy = sinon.spy();

describe('Forms config', () => {
    describe('formVersionsTableColumns', () => {
        it('sould return an array of 4 columns', () => {
            formVersionscolumns = formVersionsTableColumns(
                () => null,
                () => setForceRefreshSpy(),
            );
            expect(formVersionscolumns).to.have.lengthOf(4);
        });
        it('should render a component if Cell is defined', () => {
            formVersionscolumns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(fakeFormVersion));
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if Cell is defined and missing start_period, end_period and version_id', () => {
            formVersionscolumns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(
                        colOriginal(formVersionsfixture.form_versions[1]),
                    );
                    expect(cell).to.exist;
                }
            });
        });
        it('should open a tab on click on xls icon', () => {
            actionColumn = formVersionscolumns[formVersionscolumns.length - 1];
            wrapper = shallow(actionColumn.Cell(colOriginal(fakeFormVersion)));
            xlsButton = wrapper.find(IconButton);

            expect(xlsButton).to.have.lengthOf(1);
            const openStub = sinon.stub(window, 'open');
            xlsButton.props().onClick();
            expect(openStub).to.have.been.called;
            sinon.restore();
        });
    });
    describe('formsTableColumns', () => {
        it('should return an array of 10 columns', () => {
            columns = formsTableColumns({
                formatMessage: () => null,
            });
            expect(columns).to.have.lengthOf(10);
        });
        it('should render a component if Cell is defined', () => {
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(fakeForm));
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if Cell is defined and no from id', () => {
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(
                        colOriginal({
                            ...fakeForm,
                            form_id: 0,
                        }),
                    );
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if value not present and Cell is defined', () => {
            const tempForm = { ...fakeForm };
            delete tempForm.instance_updated_at;
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(tempForm));
                    expect(cell).to.exist;
                }
            });
        });
    });
});
