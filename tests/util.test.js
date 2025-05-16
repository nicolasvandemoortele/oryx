const { extractUUID } = require("../libs/util");

test('Extract UUID from string', () => {
    const inputString = "Test 1 - 14e1ff84-b91c-42d0-84c7-8a5ca02b6af8";
    const expectedUUID = "14e1ff84-b91c-42d0-84c7-8a5ca02b6af8";
    const result = extractUUID(inputString);
    expect(result).toBe(expectedUUID);
});

test('String with no UUID should return null', () => {
    const inputString = "Test 1 - lorem ipsum dolor sit amet";
    const result = extractUUID(inputString);
    expect(result).toBe(null);
});