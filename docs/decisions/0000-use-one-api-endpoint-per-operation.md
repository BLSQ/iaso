# Use One API Endpoint Per Operation

* Status: accepted
* Date: 2025-07-23

## Context and Problem Statement

The code base has 2 types of endpoints: centralized, all-purpose endpoints around a model (e.g: OrgUnit), or ultra-specific endpoints that serve a single purpose. We need to settle on one philosophy going forward to get a consistent easy to maintain code base

## Decision Drivers

* Feature stability
* ease of maintenance
* ease of API use
* development cost
* function (old_index, new_index) {
    // Shortcut helper to move item to end of array
    if (-1 === new_index) {
        new_index = this.length - 1;
    }

    if (new_index >= this.length) {
        var k = new_index - this.length;
        while (k-- + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
}

## Considered Options

* Multi-purpose endpoint
* Specific endpoints

## Decision Outcome

Chosen option: "Specific endpoints", because Removing a single point of failure seems worth the trade-offs, and maintening several small endpoints seems manageable

### Positive Consequences

* More stable APIs
* APIs easier to document and test

### Negative Consequences

* Lots of refactoring needed

## Pros and Cons of the Options

### Multi-purpose endpoint

Have one endpoint that can receive multiple parameters so users can tailor the response to their needs

* Good, because Easy for users to know which endpoint to use
* Good, because No need to develop a new endpoint for each use case
* Good, because Centralized API logic
* Bad, because Single point of failure. If the endpoint goes down, failure happens across the board
* Bad, because Becomes hard to maintain as use cases and edge cases pile up

### Specific endpoints

Have one tailor made endpoint per use case

* Good, because No single point of failure
* Good, because Easy to maintain as amount of logic and code per endpoint remains limited
* Good, because No side-effects when modifying an API
* Bad, because Can lead to a lot of code duplication, which can be a pain to maintain
* Bad, because Generates more custom development
* Bad, because Can lead to multiple endpoints covering the same use case if not managed correctly by the team (eg: multiple dropdowns for the same model)
