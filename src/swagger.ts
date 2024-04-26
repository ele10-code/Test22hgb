import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const setupSwagger = (app: Express): void => {
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
            servers: [{ url: 'http://localhost:3002' }]
        },
        apis: ['./src/*.ts'], 
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

export default setupSwagger;
