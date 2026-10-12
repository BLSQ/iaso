import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    scenarios: {
        id: 'iaso.scenarios.label.scenarios',
        defaultMessage: 'Scenarios',
    },
    journey: {
        id: 'iaso.scenarios.label.journey',
        defaultMessage: 'Journey',
    },
    lastResult: {
        id: 'iaso.scenarios.label.lastResult',
        defaultMessage: 'Last result',
    },
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Action(s)',
    },
    import: {
        id: 'iaso.scenarios.label.import',
        defaultMessage: 'Import',
    },
    runAll: {
        id: 'iaso.scenarios.label.runAll',
        defaultMessage: 'Run all',
    },
    run: {
        id: 'iaso.scenarios.label.run',
        defaultMessage: 'Run',
    },
    download: {
        id: 'iaso.scenarios.label.download',
        defaultMessage: 'Download',
    },
    deleteScenario: {
        id: 'iaso.scenarios.label.deleteScenario',
        defaultMessage: 'Delete this scenario?',
    },
    noScenarios: {
        id: 'iaso.scenarios.label.noScenarios',
        defaultMessage:
            'No scenarios yet: import scenario files (.json) to test this workflow.',
    },
    notRun: {
        id: 'iaso.scenarios.label.notRun',
        defaultMessage: 'Not run',
    },
    passed: {
        id: 'iaso.scenarios.label.passed',
        defaultMessage: 'Passed',
    },
    failed: {
        id: 'iaso.scenarios.label.failed',
        defaultMessage: 'Failed',
    },
    error: {
        id: 'iaso.scenarios.label.error',
        defaultMessage: 'Could not run',
    },
    atStep: {
        id: 'iaso.scenarios.label.atStep',
        defaultMessage: 'at step {step}',
    },
    onOtherVersion: {
        id: 'iaso.scenarios.label.onOtherVersion',
        defaultMessage: 'on another workflow version',
    },
    runDone: {
        id: 'iaso.scenarios.label.runDone',
        defaultMessage: 'Scenarios run',
    },
    imported: {
        id: 'iaso.scenarios.label.imported',
        defaultMessage: 'Scenario imported',
    },
    notJson: {
        id: 'iaso.scenarios.label.notJson',
        defaultMessage: '{file} is not a JSON file',
    },
    step: {
        id: 'iaso.scenarios.label.step',
        defaultMessage: 'Step {index}: {form}',
    },
    answers: {
        id: 'iaso.scenarios.label.answers',
        defaultMessage: 'Answers given',
    },
    prefilled: {
        id: 'iaso.scenarios.label.prefilled',
        defaultMessage: 'Prefilled',
    },
    submission: {
        id: 'iaso.scenarios.label.submission',
        defaultMessage: 'The form as filled',
    },
    scenario: {
        id: 'iaso.scenarios.label.scenario',
        defaultMessage: 'Scenario',
    },
    refused: {
        id: 'iaso.scenarios.label.refused',
        defaultMessage: 'Refused',
    },
    notOffered: {
        id: 'iaso.scenarios.label.notOffered',
        defaultMessage: 'Not offered',
    },
    openScenariosPage: {
        id: 'iaso.scenarios.label.openScenariosPage',
        defaultMessage: 'Open the scenarios page',
    },
    scenariosFor: {
        id: 'iaso.scenarios.label.scenariosFor',
        defaultMessage: 'Scenarios for {entityType}',
    },
    intro: {
        id: 'iaso.scenarios.label.intro',
        defaultMessage:
            "Describe a journey once: the forms filled, and what the entity's information should contain after each one. IASO replays it against a workflow version, as the app would, and tells you if the app behaves differently. Nothing is saved: no entity, no submission.",
    },
    testAgainst: {
        id: 'iaso.scenarios.label.testAgainst',
        defaultMessage: 'Test against',
    },
    notPassingCount: {
        id: 'iaso.scenarios.label.notPassingCount',
        defaultMessage: '{count} not passing',
    },
    passingCount: {
        id: 'iaso.scenarios.label.passingCount',
        defaultMessage: '{count} passing',
    },
    lastRun: {
        id: 'iaso.scenarios.label.lastRun',
        defaultMessage: 'Last run {when}',
    },
    whatWentWrong: {
        id: 'iaso.scenarios.label.whatWentWrong',
        defaultMessage: 'What went wrong',
    },
    rule: {
        id: 'iaso.scenarios.label.rule',
        defaultMessage: 'Rule',
    },
    valuesUsed: {
        id: 'iaso.scenarios.label.valuesUsed',
        defaultMessage: 'Values used',
    },
    forms: {
        id: 'iaso.scenarios.label.forms',
        defaultMessage: 'Forms',
    },
    appWouldFail: {
        id: 'iaso.scenarios.label.appWouldFail',
        defaultMessage: 'The app would fail',
    },
    yes: {
        id: 'iaso.scenarios.label.yes',
        defaultMessage: 'Yes',
    },
    no: {
        id: 'iaso.scenarios.label.no',
        defaultMessage: 'No',
    },
    followupOrder: {
        id: 'iaso.scenarios.label.followupOrder',
        defaultMessage: 'follow-up order {order}',
    },
    question: {
        id: 'iaso.scenarios.label.question',
        defaultMessage: 'Question',
    },
    afterStep: {
        id: 'iaso.scenarios.label.afterStep',
        defaultMessage: 'After step {index}',
    },
    formsOfferedBefore: {
        id: 'iaso.scenarios.label.formsOfferedBefore',
        defaultMessage: 'Forms offered before step {index}',
    },
    formsOfferedAfter: {
        id: 'iaso.scenarios.label.formsOfferedAfter',
        defaultMessage: 'Forms offered after step {index}',
    },
    lastRunOn: {
        id: 'iaso.scenarios.label.lastRunOn',
        defaultMessage:
            'Run {when} \u00b7 {version} \u00b7 current form versions',
    },
    formsOnly: {
        id: 'iaso.scenarios.label.formsOnly',
        defaultMessage: 'forms only',
    },
    notRunYet: {
        id: 'iaso.scenarios.label.notRunYet',
        defaultMessage: 'Not run yet',
    },
    showTechnicalNames: {
        id: 'iaso.scenarios.label.showTechnicalNames',
        defaultMessage: 'Show technical names and rules',
    },
    runAgain: {
        id: 'iaso.scenarios.label.runAgain',
        defaultMessage: 'Run again',
    },
    allChecksPass: {
        id: 'iaso.scenarios.label.allChecksPass',
        defaultMessage:
            'Every check passes: the app would behave as described.',
    },
    informationAtEachStep: {
        id: 'iaso.scenarios.label.informationAtEachStep',
        defaultMessage: '{entityType} information at each step',
    },
    forSupport: {
        id: 'iaso.scenarios.label.forSupport',
        defaultMessage: 'For support',
    },
    forSupportText: {
        id: 'iaso.scenarios.label.forSupportText',
        defaultMessage:
            'The scenario file: import it on another server or account, or attach it to a support ticket.',
    },
    downloadScenarioFile: {
        id: 'iaso.scenarios.label.downloadScenarioFile',
        defaultMessage: 'Download the scenario file',
    },
    newScenario: {
        id: 'iaso.scenarios.label.newScenario',
        defaultMessage: 'New scenario',
    },
    editScenario: {
        id: 'iaso.scenarios.label.editScenario',
        defaultMessage: 'Edit the scenario',
    },
    edit: {
        id: 'iaso.scenarios.label.edit',
        defaultMessage: 'Edit',
    },
    scenarioName: {
        id: 'iaso.scenarios.label.scenarioName',
        defaultMessage: 'Scenario name',
    },
    scenarioDescription: {
        id: 'iaso.scenarios.label.scenarioDescription',
        defaultMessage: 'What this scenario checks',
    },
    stepForm: {
        id: 'iaso.scenarios.label.stepForm',
        defaultMessage: 'Step {index}: form',
    },
    offered: {
        id: 'iaso.scenarios.label.offered',
        defaultMessage: 'Offered',
    },
    notOfferedForce: {
        id: 'iaso.scenarios.label.notOfferedForce',
        defaultMessage: 'not offered (fill anyway)',
    },
    stepDate: {
        id: 'iaso.scenarios.label.stepDate',
        defaultMessage: 'Date of this step',
    },
    stepDateHelp: {
        id: 'iaso.scenarios.label.stepDateHelp',
        defaultMessage:
            'Empty: the day of the run. A fixed date for a campaign calendar.',
    },
    whatHappensInThisStep: {
        id: 'iaso.scenarios.label.whatHappensInThisStep',
        defaultMessage: 'What happens in this step (optional)',
    },
    formNotOfferedWarning: {
        id: 'iaso.scenarios.label.formNotOfferedWarning',
        defaultMessage:
            "The app doesn't offer this form at this point: the step fills it anyway.",
    },
    noFollowupOffersIt: {
        id: 'iaso.scenarios.label.noFollowupOffersIt',
        defaultMessage: 'No follow-up of this workflow version offers it.',
    },
    offeredWhen: {
        id: 'iaso.scenarios.label.offeredWhen',
        defaultMessage: 'The app offers it when:',
    },
    nowValues: {
        id: 'iaso.scenarios.label.nowValues',
        defaultMessage: 'Now: {values}',
    },
    entityInformation: {
        id: 'iaso.scenarios.label.entityInformation',
        defaultMessage: '{entityType} information',
    },
    afterOnSubmit: {
        id: 'iaso.scenarios.label.afterOnSubmit',
        defaultMessage: 'Submit the form to see it after the step.',
    },
    notRegisteredYet: {
        id: 'iaso.scenarios.label.notRegisteredYet',
        defaultMessage: 'Not registered yet: this step registers it.',
    },
    prefilledFromEntity: {
        id: 'iaso.scenarios.label.prefilledFromEntity',
        defaultMessage:
            "Already filled from the entity's information, as the phone does: {values}",
    },
    searchBeforeRegistering: {
        id: 'iaso.scenarios.label.searchBeforeRegistering',
        defaultMessage: 'Search before registering',
    },
    searchBeforeRegisteringHelp: {
        id: 'iaso.scenarios.label.searchBeforeRegisteringHelp',
        defaultMessage:
            'As on the phone: the app first searches on these questions (typed, or a scanned QR code), then registers with them filled in the form.',
    },
    searchButton: {
        id: 'iaso.scenarios.label.searchButton',
        defaultMessage: 'Search',
    },
    searchNeedsEveryQuestion: {
        id: 'iaso.scenarios.label.searchNeedsEveryQuestion',
        defaultMessage:
            'The app keeps “Add an entity” disabled until every question is filled.',
    },
    searchNothingFound: {
        id: 'iaso.scenarios.label.searchNothingFound',
        defaultMessage:
            'Nothing found: the app lets you register, these values filled in the form.',
    },
    showAllFields: {
        id: 'iaso.scenarios.label.showAllFields',
        defaultMessage: 'Show all {count} fields',
    },
    showMainFields: {
        id: 'iaso.scenarios.label.showMainFields',
        defaultMessage: 'Show only the main and changed fields',
    },
    saveStepAndAddNext: {
        id: 'iaso.scenarios.label.saveStepAndAddNext',
        defaultMessage: 'Save the step and add the next one',
    },
    saveScenario: {
        id: 'iaso.scenarios.label.saveScenario',
        defaultMessage: 'Save the scenario',
    },
    scenarioSaved: {
        id: 'iaso.scenarios.label.scenarioSaved',
        defaultMessage: 'Scenario saved',
    },
    noReferenceForm: {
        id: 'iaso.scenarios.label.noReferenceForm',
        defaultMessage:
            'This entity type has no reference form: no scenario can register an entity.',
    },
    nothingOffered: {
        id: 'iaso.scenarios.label.nothingOffered',
        defaultMessage:
            'The app offers no form at this point. Pick a form to fill it anyway, or save the scenario.',
    },
    checksCount: {
        id: 'iaso.scenarios.label.checksCount',
        defaultMessage: '{count} checks',
    },
    fillingNow: {
        id: 'iaso.scenarios.label.fillingNow',
        defaultMessage: 'Filling now',
    },
    addStep: {
        id: 'iaso.scenarios.label.addStep',
        defaultMessage: 'Add a step',
    },
    whatTheAppDid: {
        id: 'iaso.scenarios.label.whatTheAppDid',
        defaultMessage: 'What the app did',
    },
    stepNotRun: {
        id: 'iaso.scenarios.label.stepNotRun',
        defaultMessage: 'Not run: the scenario stopped before this step.',
    },
    thisStepChecks: {
        id: 'iaso.scenarios.label.thisStepChecks',
        defaultMessage: 'What this step checks',
    },
    noChecks: {
        id: 'iaso.scenarios.label.noChecks',
        defaultMessage: 'Nothing: the step only has to go through.',
    },
    inTheForm: {
        id: 'iaso.scenarios.label.inTheForm',
        defaultMessage: 'In the form: {question} = {value}',
    },
    refusedOn: {
        id: 'iaso.scenarios.label.refusedOn',
        defaultMessage: 'The form refuses {question} ({code})',
    },
    whatTheAppWillDo: {
        id: 'iaso.scenarios.label.whatTheAppWillDo',
        defaultMessage: 'What the app will do',
    },
    submitToSee: {
        id: 'iaso.scenarios.label.submitToSee',
        defaultMessage: 'Submit the form to see it',
    },
    formRefuses: {
        id: 'iaso.scenarios.label.formRefuses',
        defaultMessage: 'The form refuses the answers',
    },
    formsOfferedNext: {
        id: 'iaso.scenarios.label.formsOfferedNext',
        defaultMessage: 'Forms offered next',
    },
    informationWillChange: {
        id: 'iaso.scenarios.label.informationWillChange',
        defaultMessage: "The entity's information will change",
    },
    nothingSaved: {
        id: 'iaso.scenarios.label.nothingSaved',
        defaultMessage:
            'Nothing is saved. The result comes from the same engine as the phone app.',
    },
    shouldBeRefused: {
        id: 'iaso.scenarios.label.shouldBeRefused',
        defaultMessage: 'This step should be refused',
    },
    expectRefusal: {
        id: 'iaso.scenarios.label.expectRefusal',
        defaultMessage: 'Expect the form to refuse these answers',
    },
    fixAnswersOrExpectRefusal: {
        id: 'iaso.scenarios.label.fixAnswersOrExpectRefusal',
        defaultMessage:
            'The form refuses the answers: change them in the form, or expect the refusal.',
    },
    whatShouldBeChecked: {
        id: 'iaso.scenarios.label.whatShouldBeChecked',
        defaultMessage: 'What should this scenario check?',
    },
    sendToChooseChecks: {
        id: 'iaso.scenarios.label.sendToChooseChecks',
        defaultMessage:
            "Send the form above: you'll then tick what this step must check - the forms offered next, the entity's information, or a refusal.",
    },
    whatShouldBeCheckedText: {
        id: 'iaso.scenarios.label.whatShouldBeCheckedText',
        defaultMessage:
            'This is what happened when you filled the form. Tick what must stay true: next time, IASO tells you if it changes.',
    },
    formsOfferedShouldBe: {
        id: 'iaso.scenarios.label.formsOfferedShouldBe',
        defaultMessage: 'The forms offered next should be: {forms}',
    },
    showUnchanged: {
        id: 'iaso.scenarios.label.showUnchanged',
        defaultMessage: 'Show the {count} values that did not change',
    },
    hideUnchanged: {
        id: 'iaso.scenarios.label.hideUnchanged',
        defaultMessage: 'Hide the {count} values that did not change',
    },
    moreActions: {
        id: 'iaso.scenarios.label.moreActions',
        defaultMessage: 'More actions',
    },
    importFiles: {
        id: 'iaso.scenarios.label.importFiles',
        defaultMessage: 'Import scenario files (.json)',
    },
});

export default MESSAGES;
