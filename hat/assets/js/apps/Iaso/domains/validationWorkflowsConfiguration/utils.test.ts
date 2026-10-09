import {
    canBypass,
    canValidate,
    canValidateOrBypass,
} from 'Iaso/domains/validationWorkflowsConfiguration/utils';

describe('canValidateOrBypass', () => {
    it('when can validate is true and not canBypass', () => {
        const timeline = {
            status: 'UNKNOWN',
            user_can_do_actions: true,
        };
        expect(canValidateOrBypass(timeline)).to.equal(true);
    });
    it('when can canBypass is true and not validate', () => {
        const timeline = {
            type: 'NEXT_BYPASS',
            user_can_do_actions: true,
        };
        expect(canValidateOrBypass(timeline)).to.equal(true);
    });
    it('when both canBypass and validate are true', () => {
        const timeline = {
            type: 'NEXT_BYPASS',
            status: 'UNKNOWN',
            user_can_do_actions: true,
        };
        expect(canValidateOrBypass(timeline)).to.equal(true);
    });
    it('when both canBypass and validate are false', () => {
        const timeline = {
            type: 'NEXT-STOP',
            status: 'ACCEPTED',
            user_can_do_actions: false,
        };
        expect(canValidateOrBypass(timeline)).to.equal(false);
    });
});

describe('canValidate', () => {
    it('when status is unknown and user can do action', () => {
        const timeline = {
            status: 'UNKNOWN',
            user_can_do_actions: true,
        };
        expect(canValidate(timeline)).to.equal(true);
    });
    it('when status is unknown and user can not do action', () => {
        const timeline = {
            status: 'UNKNOWN',
            user_can_do_actions: false,
        };
        expect(canValidate(timeline)).to.equal(false);
    });
    it('when status is accepted and user can do action', () => {
        const timeline = {
            status: 'ACCEPTED',
            user_can_do_actions: true,
        };
        expect(canValidate(timeline)).to.equal(false);
    });
    it('when status is accepted and user can not do action', () => {
        const timeline = {
            type: 'ACCEPTED',
            user_can_do_actions: false,
        };
        expect(canValidate(timeline)).to.equal(false);
    });
    it('when status is null and user can do action', () => {
        const timeline = {
            status: null,
            user_can_do_actions: true,
        };
        expect(canValidate(timeline)).to.equal(false);
    });
    it('when status is null and user can not do action', () => {
        const timeline = {
            type: null,
            user_can_do_actions: false,
        };
        expect(canValidate(timeline)).to.equal(false);
    });
});

describe('canBypass', () => {
    it('when type is next_bypass and user can do action', () => {
        const timeline = {
            type: 'NEXT_BYPASS',
            user_can_do_actions: true,
        };
        expect(canBypass(timeline)).to.equal(true);
    });
    it('when type is next_bypass and user can not do action', () => {
        const timeline = {
            type: 'NEXT_BYPASS',
            user_can_do_actions: false,
        };
        expect(canBypass(timeline)).to.equal(false);
    });
    it('when type is not next_bypass and user can do action', () => {
        const timeline = {
            type: 'NEXT_STEP',
            user_can_do_actions: true,
        };
        expect(canBypass(timeline)).to.equal(false);
    });
    it('when type is not next_bypass and user can not do action', () => {
        const timeline = {
            type: 'NEXT_STEP',
            user_can_do_actions: false,
        };
        expect(canBypass(timeline)).to.equal(false);
    });
});
