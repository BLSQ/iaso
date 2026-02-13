// example of a setup file where you can define something that will be applied to all tests
beforeAll(() => {
    console.log('this is a beforeAll from setup. eg setLanguage')
})
afterAll(() => {
    console.log('this is an afterAll from setup. eg clear Mock')
})