const { expect } = require('chai');
const { ChaincodeMockStub, Transform} = require('@theledger/fabric-mock-stub');

const Chaincode = require('../mycc.js');

const myChainCode = new Chaincode();

describe('test chaincode', async () => {
    const mockStub = new ChaincodeMockStub('MyMockStub', myChainCode);
    it('Should init without issues', async () => {
        const response = await mockStub.mockInit('tx1', []);
        expect(response.status).to.equal(200);
    });
    it('Return errors if method does not exist', async () => {
        const testFunction = 'testFunction';
        const response = await mockStub.mockInvoke('tx1', [testFunction, 'test']);
        console.log(response);
        expect(response.message).to.equal(`Received unknown function ${testFunction} invocation`);
    });
})