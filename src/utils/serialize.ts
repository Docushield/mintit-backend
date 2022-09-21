const isNotNumber = (value) => {
  return typeof value === "number" && isNaN(value);
};

const isInfinity = (value) => {
  return typeof value === "number" && !isFinite(value);
};

const isNull = (value) => {
  return value === null && typeof value === "object";
};

const nullDataTypes = (value) => {
  return isNotNumber(value) || isInfinity(value) || isNull(value);
};
const isUndefined = (value) => {
  return value === undefined && typeof value === "undefined";
};

const isFunction = (value) => {
  return typeof value === "function";
};

const isSymbol = (value) => {
  return typeof value === "symbol";
};

const ignoreDataTypes = (value) => {
  return isUndefined(value) || isFunction(value) || isSymbol(value);
};

const removeComma = (str) => {
  const tempArr = str.split("");
  tempArr.pop();
  return tempArr.join("");
};

export const objCustomStringify = (obj: object) => {
  let objStr = "";

  const objKeys = Object.keys(obj);

  console.log(obj, objKeys);
  objKeys.forEach((eachKey) => {
    const eachValue = obj[eachKey];
    if (eachKey == "stakeholder-guard") {
      objStr += `"${eachKey}": (read-msg ${obj["description"]}-guard),`;
    } else {
      objStr += !ignoreDataTypes(eachValue)
        ? Array.isArray(eachValue) && typeof eachValue === "object"
          ? `"${eachKey}": ${customStringify(eachValue as [object])},`
          : `"${eachKey}": ${JSON.stringify(eachValue)},`
        : "";
    }
  });
  return `{` + removeComma(objStr) + `}`;
};

export const customStringify = (obj: [object]) => {
  let arrStr = "";
  const arrayValuesNullTypes = (value) => {
    return (
      isNotNumber(value) ||
      isInfinity(value) ||
      isNull(value) ||
      ignoreDataTypes(value)
    );
  };
  obj.forEach((eachValue) => {
    arrStr += arrayValuesNullTypes(eachValue)
      ? JSON.stringify(null)
      : objCustomStringify(eachValue);
    arrStr += ",";
  });

  return `[` + removeComma(arrStr) + `]`;
};
