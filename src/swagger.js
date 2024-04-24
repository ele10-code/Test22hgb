const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

module.exports = (app) => {
    const swaggerOptions = {
        swaggerDefinition: {
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
                description: 'A sample API',
                contact: {
                    name: "API Support",
                    url: "http://www.example.com",
                    email: "support@example.com"
                },
            },
            servers: [{
                url: 'http://localhost:3001'
            }]
        },
        apis: ['./routes/*.js'], // path to the APIs
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
