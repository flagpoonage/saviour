const fork = require('child_process').fork;

const buildArgumentLog = (source, type, ...args) => 
  args.join('\n')
    .replace('\r\n', '\n')
    .replace('\r', '\n')
    .split('\n')
    .map(a => `${source} [${type}] | ${a.toString()}`).join('\n') + '\n';

const error_exit = (message, exception) => {
  console.error(message);
  console.error(exception.stack);
  process.exit(1);
};

const loadMaster = function(options) {
  try {

    for(let name in this.plugins) {
      try {
        this.plugins[name] = this.plugins[name](
          message => this.send(name, { payload: message })
        );

        this._intercepters[name] = (type, message) => {
          
        };
      }
      catch (exception) {
        error_exit(`Unable to initialize plugin [${name}]`, exception);
      }
    }
    
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

      if(!this._evhandlers.finalize) {
        return code;
      }

      let result = this._evhandlers.finalize(code, code => process.exit(code || 0), this);

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
    if(this.workerProcess && this.workerProcess.kill) {
      this.workerProcess.kill('SIGTERM');
    }

    error_exit('Unable to spawn child process', exception);
  }
};

const loadWorker = function() {
  process.on('message', message => {
    this._evhandlers.message && this._evhandlers.message(message, this);
  });

  for(let name in this.plugins) {
    try {
      this.plugins[name] = this.plugins[name]('hello');
    }
    catch (exception) {
      error_exit(`Unable to initialize plugin [${name}]`, exception);
    }
  }

  if (typeof this._evhandlers.init === 'function') {
    this._evhandlers.init(this);
  }
};

const setConsole = (pname, debugging) => {
  global.console.log = debugging ? function (...args) {
    process.stdout.write(buildArgumentLog(pname, 'DBG', ...args));
  } : () => {};

  global.console.info = function (...args) {
    process.stdout.write(buildArgumentLog(pname, 'INF', ...args));
  };

  global.console.warn = function (...args) {
    process.stderr.write(buildArgumentLog(pname, 'WRN', ...args));
  };

  global.console.error = function (...args) {
    process.stderr.write(buildArgumentLog(pname, 'ERR', ...args));
  };
};

const setPlugins = function(plugins) {
  this.plugins = {};
  this._intercepters = {};

  for(let name in plugins) {
    if(!plugins[name].module) {
      throw `Unable to load plugin [${name}], module not specified`;
    }

    try {
      this.plugins[name] = require(plugins[name].module);
    }
    catch (exception) {
      error_exit(`Unable to load plugin [${name}], error loading module`, exception);
    }

    console.log(`Loaded plugin module [${name}]`);
  }
};

module.exports = class Saviour {
  constructor (options) {

    options = options || {};

    this.isWorker = process.env.SAVIOUR_FORK;
    this._evhandlers = {};
    this._procname = this.isWorker ? 'WORKER' : 'MASTER';

    setConsole(this._procname, options.debugMode);

    if (options.plugins) {
      setPlugins.call(this, options.plugins);
    }

    process.nextTick(
      (f => () => f.call(this, options))(this.isWorker ? loadWorker : loadMaster));
  }

  on (event, handler) {
    this._evhandlers[event] = handler;
  }

  send (type, data) {
    if(!this.isWorker) {
      return this.workerProcess.send(Object.assign({}, data || {}, { type: type }));
    }
    else {
      return process.send(Object.assign({}, data || {}, { type: type }));
    }
  }

  wait (time) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }
};