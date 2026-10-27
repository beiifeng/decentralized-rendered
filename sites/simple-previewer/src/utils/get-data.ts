const UUIDV4_LENGTH = 37;
const PRIMITIVE_TYPES = ["string", "number", "boolean", "undefined"];
const UuidAllRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

function isUUID(input: string | undefined): boolean {
  if (!input) {
    return false;
  }
  return UuidAllRegex.test(input);
}

function startsWithUuidV4(input: string | undefined): input is string {
  if (input && typeof input === "string") {
    const elements = input.split(":");
    return isUUID(elements[0]);
  }
  return false;
}

function typedStringToPrimitive(input: string): number | string | boolean | null | undefined {
  const [type, ...valueArray] = input.split(":");
  const value = valueArray.join(":"); // just in case there are colons in the value

  switch (type) {
    case "number":
      return Number(value);
    case "string":
      return String(value);
    case "boolean":
      return value === "true";
    case "null":
      return null;
    case "undefined":
      return undefined;
    default:
      // never run into this code.
      throw new Error(`Parsing error, type annotation not found in string: ${input}`);
  }
}

function unSalt(value: string | undefined): string | number | boolean | null | undefined {
  if (startsWithUuidV4(value)) {
    const untypedValue = value.substring(UUIDV4_LENGTH).trim();
    return typedStringToPrimitive(untypedValue);
  }
  return value;
}

function recursivelyApply(iteratee: (value: any) => any): (value: any) => any {
  return (value) => {
    if (PRIMITIVE_TYPES.includes(typeof value) || value === null) {
      return iteratee(value);
    }
    return deepMap(value, iteratee);
  };
}

function map(array: any, iteratee: (value: any) => any): any[] {
  const result: any[] = [];
  for (const item of array) {
    result.push(iteratee(item));
  }
  return result;
}

function mapValues(obj: any, iteratee: (value: any) => any): Record<string, any> {
  const result: any = {};
  Object.entries(obj).forEach(([key, val]) => {
    result[key] = iteratee(val);
  });
  return result;
}

function deepMap(collection: any, iteratee: (value: any) => any): any {
  if (Array.isArray(collection)) {
    return map(collection, recursivelyApply(iteratee));
  }
  if (typeof collection === "object") {
    return mapValues(collection, recursivelyApply(iteratee));
  }
  return collection;
}

function getData<T>(obj: any): T {
  if (obj.data && obj.data.$template) {
    return deepMap(obj.data, unSalt);
  } else if (obj.$template) {
    return deepMap(obj, unSalt);
  } else {
    throw new Error("Invalid OpenCerts data format.");
  }
}

export default getData;
