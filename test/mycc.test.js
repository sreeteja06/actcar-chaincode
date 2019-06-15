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
        // console.log(response);
        expect(response.message).to.equal(`Received unknown function ${testFunction} invocation`);
    });

    it('intializes the chain', async ()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        console.log(response)
    })

    it('checks the manu details', async()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        // console.log(response)
        functionName = "getManuDetails";
        response = await mockStub.mockInvoke('tx2',[functionName, "M001"])
        // console.log(response);
        expect(response.payload).to.equal('{"name":"toyoto","models":["TOmodel1","TOmodel2","TOmodel3","TOmodel4"]}');
    })
    it('manufacture a car', async()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "getCarDetails";
        response = await mockStub.mockInvoke('tx3',[functionName, "1"]);
        expect(response.payload).to.equal('{"carID":"1","manu":"toyoto","model":"TOmodel1","color":"green","owner":"M001","forSale":true,"dealer":"","request":""}');
    })

    it("check if the car is in the manufactured cars", async()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "getCarDetails";
        response = await mockStub.mockInvoke('tx3',[functionName, "1"]);
        functionName = "getManufactuerdCars";
        response = await mockStub.mockInvoke('tx4', [functionName, "M001"]);
        expect(response.payload).to.equal('["1"]');
    })

    it("request manufacture and check if it is removed from manufacture list and added to requested list", async()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "getCarDetails";
        response = await mockStub.mockInvoke('tx3',[functionName, "1"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        functionName = "getManufactuerdCars";
        response = await mockStub.mockInvoke('tx5', [functionName, "M001"]);
        console.warn("manufactured cars"+response.payload);
        functionName = "getAllRequestedCars";
        response = await mockStub.mockInvoke('tx6', [functionName, "M001"]);
        console.warn("all requested cars"+response.payload);

    })


})