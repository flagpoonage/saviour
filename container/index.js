const fork = require('child_process').fork;
const schema = require('./schema');
const Logger = require('../utils/logger')();
const LOG_LEVEL = require('../utils/constants');

module.exports = class Container {
  constructor (options) {
    options.serviceArgs = options.serviceArgs || [];
    options.restartAttempts = options.restartAttempts || 5;

    schema.constructorOptions(options);

    this.options = options;

    this.childProcess = this.spawnWorker(options.service. options.serviceArgs);
    
    this.childProcess.stderr.on('data', data => {
      this.logWorker(LOG_LEVEL.ERROR, data);
    });
    
    this.childProcess.stdout.on('data', data => {
      this.logWorker(LOG_LEVEL.INFO, data);
    });

    this.childProcess.on('close', code => {
      if(code === 0) {
        this.logMaster(LOG_LEVEL.INFO, 'Child process exited normally. Shutting down.');
        process.exit(0);
      }
      else {

      }
    });

    this.childProcess.on('error', error => {
      this.logWorker(LOG_LEVEL.ERROR, error);
    });
  }

  logWorker (level, ...args) {
    Logger.writeLog(level, 'WORKER', ...args);
  }

  logMaster (level, ...args) {
    Logger.writeLog(level, 'MASTER', ...args);
  }

  spawnWorker (servicePath, serviceArgs) {
    try {
      return fork(servicePath, serviceArgs, { stdio: ['ipc', 'pipe', 'pipe' ] });
    }
    catch (exception) {
      this.logMaster(LOG_LEVEL.ERROR, 'Unable to spawn child process', exception);
    }
  }
};