"use strict";
/// <reference types="@types/jest" />;
jest.mock('amqp-connection-manager', () => ({
    connect: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        createChannel: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            sendToQueue: jest.fn(),
            close: jest.fn()
        })),
        close: jest.fn()
    }))
}));
jest.mock('minio', () => ({
    Client: () => ({ setRequestOptions: () => { } })
}));
//# sourceMappingURL=setupTests.js.map