const fork = require('child_process').fork;

const buildArgumentLog = (source, type, ...args) => 
  args.join('\n')
    .replace('\r\n', '\n')
    .replace('\r', '\n')
    .split('\n')
    .map(a => `${source} [${type}] | ${a.toString()}`).join('\n') + '\n';

module.exports = class Saviour {
  constructor (options) {

    options = options || {};
    this.isWorker = process.env.SAVIOUR_FORK;
    this._evhandlers = {};
    const PROC_NAME = this.isWorker ? 'WORKER' : 'MASTER';

    global.console.log = options.debugMode ? function (...args) {
      process.stdout.write(buildArgumentLog(PROC_NAME, 'DBG', ...args));
    } : () => {};

    global.console.info = function (...args) {
      process.stdout.write(buildArgumentLog(PROC_NAME, 'INF', ...args));
    };

    global.console.warn = function (...args) {
      process.stderr.write(buildArgumentLog(PROC_NAME, 'WRN', ...args));
    };

    global.console.error = function (...args) {
      process.stderr.write(buildArgumentLog(PROC_NAME, 'ERR', ...args));
    };

    if (!this.isWorker) {
      process.nextTick(() => {
        try {
          this.workerProcess = fork(
            module.parent.filename, 
            options.args || [], 
            { 
              stdio: [
                'ipc', 'pipe', 'pipe'
              ], 
              env: { 
                SAVIOUR_FORK: true 
              } 
            }
          );
          
          this.workerProcess.stderr.on('data', data => {
            process.stderr.write(data);
          });
          
          this.workerProcess.stdout.on('data', data => {
            process.stdout.write(data);
          });

          this.workerProcess.on('message', message => {
            this._evhandlers.worker && this._evhandlers.worker(message, this);
          });

          this.workerProcess.on('error', err => {
            process.stderr.write('An error occured in the internal child process', err);
          });

          this.workerProcess.on('close', code => {
            if(code === 0) {
              console.log('Worker process terminated normally');
            }
            else {
              console.log(`Worker process terminated with error code: ${code}`);
            }

            let result = this._evhandlers.finalize && this._evhandlers.finalize(code, code => process.exit(code || 0), this);

            if(!result || typeof result.catch !== 'function') {
              console.warn('You should exit the process or return a promise to exit in the finalize method');
            }
            else {
              result.then(() => {
                console.warn('You should exit the process or return a promise to exit in the finalize method');
              }).catch(error => {
                console.error('An error occurred on finalization', error);
              });
            }

          });

          console.info(`Worker process created from [${module.parent.filename}]`);
        }
        catch (exception) {
          console.error('Unable to spawn child process', exception);
        }
      });
    }
    else {
      process.nextTick(() => {
        process.on('message', message => {
          this._evhandlers.message && this._evhandlers.message(message, this);
        });

        if (typeof this._evhandlers.init === 'function') {
          this._evhandlers.init(this);
        }
      });
    }
  }

  on (event, handler) {
    this._evhandlers[event] = handler;
  }

  send (data) {
    if(!this.isWorker) {
      return this.workerProcess.send(data);
    }
    else {
      return process.send(data);
    }
  }

  wait (time) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }
};