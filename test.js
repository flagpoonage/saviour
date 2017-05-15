const Saviour = require('./index');

const Service = new Saviour(require('./test-settings.json'));

Service.on('init', () => {
  console.log('Worker initialized');

  Service.send({
    message: 'hello'
  });
});

Service.on('worker', (data) => {
  console.log('Message from worker', JSON.stringify(data, null, 2));

  Service.send({
    response: 'faggot'
  });
}); 

Service.on('message', (data) => {
  console.log('Message from master', JSON.stringify(data, null, 2));

  Service.wait(1000).then(() => process.exit(0));
});

Service.on('finalize', (code, finish) => {
  console.log(`[${code}] Finalizing...`);
  return Service.wait(1000).then(finish);
});

// Service.rabbit.on('message', (data, context) => {
//   console.log('Rabbit Message', data, context);
// });