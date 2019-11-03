// References for use of JavaScript "test" and regulat expressions:
// 1) https://www.w3schools.com/jsref/jsref_regexp_test.asp
// 2) https://stackoverflow.com/questions/6603015/check-whether-a-string-matches-a-regex-in-js
// 3) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions

// References for use of JavaScriopt to check if variable is a string
// 1) https://www.geeksforgeeks.org/javascript-check-if-a-variable-is-a-string
// 2) https://clubmate.fi/javascript-check-if-function-parameter-is-a-string-or-an-object

// Verifies if a value contained ONLY digits from 0 to 9.
function isNumeric(value) {
    return /^\d+$/.test(value);
}

// Verifies that a value is a valid 40-Hex Public Address string
function isValidPublicAddress(value) {
	if (typeof value == "string") {
		return /^[0-9a-f]{40}$/.test(value);
	}

	return false;
}

// Verifies that a value is a valid 65-Hex Public Key string
function isValidPublicKey(value) {
	if (typeof value == "string") {
		return /^[0-9a-f]{65}$/.test(value);
	}

	return false;
}

// Verifies that a value is a valid 64-Hex Signature element string
function isValidSignatureElement(value) {
	if (typeof value == "string") {
		return /^[0-9a-f]{64}$/.test(value);
	}

	return false;
}

// Verifies that a value is a valid ISO8601 date string : YYYY-MM-DDTHH:MN:SS.MSSZ
// Reference --> https://stackoverflow.com/questions/52869695/check-if-a-date-string-is-in-iso-and-utc-format
function isValid_ISO_8601_date(value) {
	if (typeof value == "string") {
		if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
			return false;
		}

		var aDate = new Date(value);
		return aDate.toISOString() === value;
	}

	return false;
}

// This method takes a JavaScript Map object that has string keys and returns back a JavaScript object that can later be
// used inside of a JSON object. Thius conversion is necessary, because there is no Map object and when an attempt was
// done to do a JSON.stringify on JavaScript object in which one of it's attributes was a JavaScript Map, the Map contents
// would not appear and only an empty {} would appear. This method fixes this problem.
//
// Inputs
// strMap : a JavaScript Map object whose keys are all strings
//
// Output : a JavaScript object in which the keys of the "strMap" are attributes with their corresponding values
//
// Example:
// strMap is: Map { 'peer_node_1' => 'http://localhost:5556', 'peer_node_2' => 'http://localhost:5557' }
// Output is: { 'peer_node_1': 'http://localhost:5556', 'peer_node_2': 'http://localhost:5557' }
//
// Reference --> https://2ality.com/2015/08/es6-map-json.html
function strMapToObj(strMap) {
  // let obj = Object.create(null);
  let obj = Object.create({});
  for (let [k,v] of strMap) {
    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    obj[k] = v;
  }
  return obj;
}

// This method takes an input that has the format of the output of the "strMapToObj" method above and returns back a
// JavaScript Map object. All the attributes should be simple string attibutes with their corresponding values.
//
// Reference --> https://2ality.com/2015/08/es6-map-json.html
function objToStrMap(obj) {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

module.exports = {
	isNumeric,
	strMapToObj,
	objToStrMap,
	isValidPublicAddress,
	isValid_ISO_8601_date,
	isValidPublicKey,
	isValidSignatureElement
}