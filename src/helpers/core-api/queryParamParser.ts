const parseNumberParams = (param: string, separator = ',') => param.split(separator).map(Number);

const parseStringParams = (param: string, separator = ',') => param.split(separator).map(String);

export { parseNumberParams, parseStringParams };
