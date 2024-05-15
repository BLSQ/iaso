/// <reference types='cypress' />

export const getCoordinates = element =>
    cy.wrap(element[0].getBoundingClientRect());

export const containsForbiddenCharacter = (value, forbiddenCharacters) => {
    for (let i = 0; i < value.length; i += 1) {
        if (forbiddenCharacters.includes(value[i])) return true;
    }
    return false;
};

export const mockSaveCall = ({
    method,
    pathname,
    requestBody,
    responseBody,
    updateInterceptFlag,
    strict,
}) => {
    updateInterceptFlag(false);
    cy.intercept(
        {
            method,
            pathname,
        },
        req => {
            updateInterceptFlag(true);
            if (strict) {
                expect(req.body).to.deep.equal(requestBody);
            } else {
                Object.keys(requestBody).forEach(field => {
                    expect(req.body[field]).to.deep.equal(requestBody[field]);
                });
            }

            req.reply({
                statusCode: 200,
                body: responseBody,
            });
        },
    ).as('save');
};
