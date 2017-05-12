const constructorOptions = options => {
  if (!options.service || typeof options.service !== 'string') {
    throw 'The service option must be a filepath to the service file';
  }

  if (!Array.isArray(options.serviceArgs)) {
    throw 'The service arguments must be an array of strings';
  }
};

module.exports = {
  constructorOptions
};