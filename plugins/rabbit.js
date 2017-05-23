class SaviourMQWorker {
  constructor (process, send, options) {
    this._process = process;
    this._options = options;
    this._send = null;
  }

  onMessage (message) {

  }
}

class SaviourMQMaster {

  constructor (process, options) {
    this._process = process;
    this._options = options;
  }

  finalize () {
    
  }
  
  onMessage (handler) {
    this._onmessage = handler;
  }

}

module.exports = function (process, send, is_worker, options) {
  return null;
  // if(is_worker) {
  //   return new SaviourMQWorker(process, send, options)
  // }
};