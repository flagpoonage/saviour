const LOG_LEVEL = require('./constants').LOG_LEVEL;

const mapLogLevel = levelStr => {
  let level = LOG_LEVEL[levelStr.toUpperCase()];

  if(typeof level !== 'number') {
    return LOG_LEVEL.ERROR;
  }

  return level;
};

class Logger {
  constructor (logLevel) {
    logLevel = logLevel || 0;

    if (typeof logLevel === 'string') {
      logLevel = mapLogLevel(logLevel);
    }

    if (typeof logLevel !== 'number') {
      throw 'Invalid log level, please specify either debug, info, error or none.';
    }

    const nlog = () => {};

    const elog = logLevel < 3 ? (source, args) => {
      process.stderr.write(makeLogString(source, args));
    } : nlog;

    const ilog = logLevel < 2 ? (source, args) => {
      process.stdout.write(makeLogString(source, args));
    } : nlog;

    const dlog = logLevel < 1 ? (source, args) => {
      process.stderr.write(makeLogString(source, args));
    } : nlog;

    const makeLogString = (level, source, args) => {
      return args.map(a => a.toString())
        .join('\n')
        .replace('\r\n', '\n')
        .replace('\r','\n')
        .split('\n')
        .map(a => {
          return `${source} - [${level}] | ${a}`;
        });
    };

    this.writeLog = (level, source, ...args) => {
      if(typeof level === 'string') {
        level = mapLogLevel(level);
      }

      if (typeof level !== 'number') {
        return;
      }

      switch(level) {
        case LOG_LEVEL.DEBUG:
          return dlog('DEBUG', source, args);
        case LOG_LEVEL.INFO:
          return ilog('INFO', source, args);
        case LOG_LEVEL.ERROR:
          return elog('ERROR', source, args);
      }
    };
  }
}

module.exports = function (options) {
  return new Logger(options);
};