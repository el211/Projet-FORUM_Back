function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(...sources) {
  const result = {};

  sources.forEach((source) => {
    if (!isObject(source)) {
      return;
    }

    Object.entries(source).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        result[key] = [...value];
        return;
      }

      if (isObject(value)) {
        result[key] = deepMerge(result[key] || {}, value);
        return;
      }

      result[key] = value;
    });
  });

  return result;
}

module.exports = {
  deepMerge
};

