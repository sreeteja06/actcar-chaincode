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
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "getCarDetails";
        response = await mockStub.mockInvoke('tx3',[functionName, "1"]);
        response = await mockStub.mockInvoke('tx3',[functionName, "2"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 2]);
        functionName = "getManufactuerdCars";
        response = await mockStub.mockInvoke('tx5', [functionName, "M001"]);
        console.warn("manufactured cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[]');
        functionName = "getAllRequestedCars";
        response = await mockStub.mockInvoke('tx6', [functionName, "M001"]);
        console.warn("all requested cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[1,2]');
    })

    it("manufacturer accepts dealer request", async () =>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "getCarDetails";
        response = await mockStub.mockInvoke('tx3',[functionName, "1"]);
        response = await mockStub.mockInvoke('tx3',[functionName, "2"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 2]);
        functionName = "acceptDealerRequest";
        response = await mockStub.mockInvoke('tx5', [functionName, "1"]);
        functionName = "getAllRequestedCars";
        response = await mockStub.mockInvoke('tx6', [functionName, "M001"]);
        console.warn("all requested cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('2');
        functionName = "carsByDealers";
        response = await mockStub.mockInvoke('tx7', [functionName, "D001"]);
        console.warn("dealer cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('1');
    });

    it("manufacturer denys dealer request", async () =>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "getCarDetails";
        response = await mockStub.mockInvoke('tx3',[functionName, "1"]);
        response = await mockStub.mockInvoke('tx3',[functionName, "2"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 2]);
        functionName = "denyDealerRequest";
        response = await mockStub.mockInvoke('tx5', [functionName, "1"]);
        functionName = "getAllRequestedCars";
        response = await mockStub.mockInvoke('tx6', [functionName, "M001"]);
        console.warn("all requested cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[2]');
        functionName = "getManufactuerdCars";
        response = await mockStub.mockInvoke('tx7', [functionName, "M001"]);
        console.warn("manufactured cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('["1"]');
    });
    it("request to buy from the dealer", async ()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        response = await mockStub.mockInvoke('tx3', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        response = await mockStub.mockInvoke('tx5', [functionName, "D001", 2]);
        functionName = "acceptDealerRequest";
        response = await mockStub.mockInvoke('tx5', [functionName, "1"]);
        response = await mockStub.mockInvoke('tx6', [functionName, "2"]);
        functionName = "requestToBuyFromDealer"
        response = await mockStub.mockInvoke('tx7', [functionName, "C001", 2]);
        functionName = "carsByDealers";
        response = await mockStub.mockInvoke('tx8', [functionName, "D001"]);
        console.warn("dealer cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('["1"]');
        functionName = "requestsForDealer";
        response = await mockStub.mockInvoke('tx9', [functionName, "D001"]);
        console.warn("dealer requested cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[2]');
    })

    it('denies the customer request', async()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        // response = await mockStub.mockInvoke('tx3', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        // response = await mockStub.mockInvoke('tx5', [functionName, "D001", 2]);
        functionName = "acceptDealerRequest";
        response = await mockStub.mockInvoke('tx5', [functionName, "1"]);
        // response = await mockStub.mockInvoke('tx6', [functionName, "2"]);
        functionName = "requestToBuyFromDealer"
        response = await mockStub.mockInvoke('tx8', [functionName, "C001", 1]);        
        // response = await mockStub.mockInvoke('tx7', [functionName, "C001", 2]);
        functionName = "denyCustomerRequest";
        response = await mockStub.mockInvoke('tx9', [functionName, 1]);
        // response = await mockStub.mockInvoke('tx10', [functionName, 2]);
        functionName = "carsByDealers";
        response = await mockStub.mockInvoke('tx11', [functionName, "D001"]);
        console.warn("dealer cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[1]');
        functionName = "requestsForDealer";
        response = await mockStub.mockInvoke('tx12', [functionName, "D001"]);
        console.warn("dealer requested cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[]');
    });

    it('accept the customer request', async()=>{
        let functionName = 'initLedger';
        let response = await mockStub.mockInvoke('tx1', [functionName]);
        functionName = "manufactureCar";
        response = await mockStub.mockInvoke('tx2', [functionName, "M001", "TOmodel1", "green"]);
        // response = await mockStub.mockInvoke('tx3', [functionName, "M001", "TOmodel1", "green"]);
        functionName = "requestManufacturer";
        response = await mockStub.mockInvoke('tx4', [functionName, "D001", 1]);
        // response = await mockStub.mockInvoke('tx5', [functionName, "D001", 2]);
        functionName = "acceptDealerRequest";
        response = await mockStub.mockInvoke('tx5', [functionName, "1"]);
        // response = await mockStub.mockInvoke('tx6', [functionName, "2"]);
        functionName = "requestToBuyFromDealer"
        response = await mockStub.mockInvoke('tx8', [functionName, "C001", 1]);        
        // response = await mockStub.mockInvoke('tx7', [functionName, "C001", 2]);
        functionName = "acceptCustomerRequest";
        response = await mockStub.mockInvoke('tx9', [functionName, 1]);
        // response = await mockStub.mockInvoke('tx10', [functionName, 2]);
        functionName = "carsByCustomers";
        response = await mockStub.mockInvoke('tx11', [functionName, "C001"]);
        console.warn("dealer cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[1]');
        functionName = "requestsForDealer";
        response = await mockStub.mockInvoke('tx12', [functionName, "D001"]);
        console.warn("dealer requested cars"+response.payload.toString());
        expect(response.payload.toString()).to.equal('[]');
    });

})