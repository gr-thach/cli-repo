const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Guardrails.io',
      version: '2.0.0'
    }
  },
  // Path to the API docs
  apis: ['dist/src/routes/**/*.js']
};

module.exports = swaggerJSDoc(options);
