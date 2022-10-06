const isNotNumber = (value: any) => {
  return typeof value === "number" && isNaN(value);
};

const isInfinity = (value: any) => {
  return typeof value === "number" && !isFinite(value);
};

const isNull = (value: any) => {
  return value === null && typeof value === "object";
};

const nullDataTypes = (value: any) => {
  return isNotNumber(value) || isInfinity(value) || isNull(value);
};
const isUndefined = (value: any) => {
  return value === undefined && typeof value === "undefined";
};

const isFunction = (value: any) => {
  return typeof value === "function";
};

const isSymbol = (value: any) => {
  return typeof value === "symbol";
};

const ignoreDataTypes = (value: any) => {
  return isUndefined(value) || isFunction(value) || isSymbol(value);
};

const removeComma = (str: string) => {
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
      objStr += `"${eachKey}": (read-msg '${obj["description"]}-guard),`;
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
  const arrayValuesNullTypes = (value: any) => {
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

export const sliceIntoChunks = (arr: any[], chunkSize: number) => {
  let res: any[] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    let chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
};
