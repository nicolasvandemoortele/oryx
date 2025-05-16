module.exports.extractUUID = (str) => {
	const uuidLen = 36;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	if (str.length <= uuidLen) {
		return uuidRegex.test(str) ? str : null;
	}
	const candidate = str.slice(-uuidLen);
    return uuidRegex.test(candidate) ? candidate : null;
}