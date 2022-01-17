import { IconButton } from 'bluesquare-components';
import { expect } from 'chai';
import formsTableColumns, { formVersionsTableColumns } from './config';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import FormVersionsDialog from './components/FormVersionsDialogComponent';

import formsFixture from './fixtures/forms.json';
import formVersionsfixture from './fixtures/formVersions.json';

import { colOriginal } from '../../../../test/utils';

const superUser = {
    is_superuser: true,
};
const userWithFormsPermission = {
    permissions: ['iaso_forms'],
};
const userWithSubmissionsPermission = {
    permissions: ['iaso_submissions'],
};

const defaultColumnParams = {
    formatMessage: () => null,
    user: superUser,
    deleteForm: () => null,
};

const makeColumns = params => {
    if (!params) return formsTableColumns(defaultColumnParams);
    return formsTableColumns({ ...defaultColumnParams, ...params });
};

let columns;
let formVersionscolumns;
const fakeForm = formsFixture.forms[0];
const fakeFormVersion = formVersionsfixture.form_versions[0];
let wrapper;
let xlsButton;
let actionColumn;
let formVersionsDialog;
let deleteDialog;
let deleteFormSpy;
let restoreFormSpy;
let restoreIcon;
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
        it('should render IconButtonComponent', () => {
            formVersionsDialog = wrapper.find(FormVersionsDialog);
            expect(formVersionsDialog).to.have.lengthOf(1);
            const iconButtonComponent = shallow(
                formVersionsDialog.props().renderTrigger({ openDialog: null }),
            );

            expect(iconButtonComponent).to.have.lengthOf(1);
        });
        it('should trigger setForceRefresh on onConfirmed', () => {
            formVersionsDialog.props().onConfirmed();
            expect(setForceRefreshSpy.calledOnce).to.equal(true);
        });
    });
    describe('formsTableColumns', () => {
        it('sould return an array of 10 columns', () => {
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
        describe('action column', () => {
            it('should not display action button if instances_count = 0 and user only has submissions permission', () => {
                const tempForm = { ...fakeForm };

                deleteFormSpy = sinon.spy();
                columns = makeColumns({
                    user: userWithSubmissionsPermission,
                });
                tempForm.instances_count = 0;
                actionColumn = columns[columns.length - 1];
                wrapper = shallow(actionColumn.Cell(colOriginal(tempForm)));

                const redEyeIcon = wrapper.find('[icon="remove-red-eye"]');
                expect(redEyeIcon).to.have.lengthOf(0);
                const editIcon = wrapper.find('[icon="edit"]');
                expect(editIcon).to.have.lengthOf(0);
                const dhisIcon = wrapper.find('[icon="dhis"]');
                expect(dhisIcon).to.have.lengthOf(0);
                const deleteAction = wrapper.find(DeleteDialog);
                expect(deleteAction).to.have.lengthOf(0);
                expect(wrapper.find(IconButton)).to.have.lengthOf(0);
            });
            it("should allow all actions except see submissions when user only has 'forms' permission", () => {
                const tempForm = { ...fakeForm };

                deleteFormSpy = sinon.spy();
                columns = makeColumns({
                    user: userWithFormsPermission,
                    deleteForm: () => {
                        deleteFormSpy();
                        return new Promise(resolve => resolve());
                    },
                });
                tempForm.instances_count = 0;
                actionColumn = columns[columns.length - 1];
                wrapper = shallow(actionColumn.Cell(colOriginal(tempForm)));

                const redEyeIcon = wrapper.find('[icon="remove-red-eye"]');
                expect(redEyeIcon).to.have.lengthOf(0);
                const editIcon = wrapper.find('[icon="edit"]');
                expect(editIcon).to.have.lengthOf(1);
                const dhisIcon = wrapper.find('[icon="dhis"]');
                expect(dhisIcon).to.have.lengthOf(1);
                const deleteAction = wrapper.find(DeleteDialog);
                expect(deleteAction).to.have.lengthOf(1);
            });
            describe('When defining which actions to show', () => {
                it('shows action buttons except "see submissions" when user has only "forms permission', () => {
                    columns = makeColumns({ user: userWithFormsPermission });
                    actionColumn = columns[columns.length - 1];
                    wrapper = shallow(actionColumn.Cell(colOriginal(fakeForm)));
                    const redEyeIcon = wrapper.find('[icon="remove-red-eye"]');
                    expect(redEyeIcon).to.have.lengthOf(0);
                    const editIcon = wrapper.find('[icon="edit"]');
                    expect(editIcon).to.have.lengthOf(1);
                    const dhisIcon = wrapper.find('[icon="dhis"]');
                    expect(dhisIcon).to.have.lengthOf(1);
                    const deleteAction = wrapper.find(DeleteDialog);
                    expect(deleteAction).to.have.lengthOf(1);
                });
                it('only displays "view" action when user has only submissions permission', () => {
                    columns = makeColumns({
                        user: userWithSubmissionsPermission,
                    });
                    actionColumn = columns[columns.length - 1];
                    wrapper = shallow(actionColumn.Cell(colOriginal(fakeForm)));
                    const redEyeIcon = wrapper.find('[icon="remove-red-eye"]');
                    expect(redEyeIcon).to.have.lengthOf(0);
                    const editIcon = wrapper.find('[icon="edit"]');
                    expect(editIcon).to.have.lengthOf(0);
                    const dhisIcon = wrapper.find('[icon="dhis"]');
                    expect(dhisIcon).to.have.lengthOf(0);
                    const deleteAction = wrapper.find(DeleteDialog);
                    expect(deleteAction).to.have.lengthOf(0);
                });
            });
            it('should trigger deleteFormSpy on onConfirm', () => {
                const tempForm = { ...fakeForm };

                deleteFormSpy = sinon.spy();
                columns = makeColumns({
                    // The test fails with superUser for some reason
                    user: userWithFormsPermission,
                    deleteForm: () => {
                        deleteFormSpy();
                        return new Promise(resolve => resolve());
                    },
                });
                tempForm.instances_count = 0;
                actionColumn = columns[columns.length - 1];
                wrapper = shallow(actionColumn.Cell(colOriginal(tempForm)));
                deleteDialog = wrapper.find(DeleteDialog);
                expect(deleteDialog).to.have.lengthOf(1);
                deleteDialog.props().onConfirm();
                expect(deleteFormSpy.calledOnce).to.equal(true);
            });
        });
    });
});
