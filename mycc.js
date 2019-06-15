const shim = require('fabric-shim');
const util = require('util');

//remove this lines after testing
class Chaincode {
    async Init(stub){
        let ret = stub.getFunctionAndParameters();
        console.info(ret);
        console.info('=========== Instantiated ACTCAR Chaincode ===========');
        return shim.success();
    }

    async Invoke(stub){
        console.info('Transaction ID: ' + stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    try{
      if (!method) {
        console.log('no function of name:' + ret.fcn + ' found');
        throw new Error('Received unknown function ' + ret.fcn + ' invocation');
      }
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      // console.log(err);
      // return shim.error(err);
      return err;
    }
    }

    async initLedger(stub){
      let manufacturers = {
        "M001":{
          "name": "toyoto",
          "models": [
            "TOmodel1", "TOmodel2", "TOmodel3", "TOmodel4"
          ]
        },
        "M002":{
          "name": "suzuki",
          "models": [
            "SUmodel1", "SUmodel2", "SUmodel3", "SUmodel4"            
          ]
        },
        "M003":{
          "name": "volkswagan",
          "models": [
            "VOmodel1", "VOmodel2", "VOmodel3", "VOmodel4"
          ]
        },
        "M004":{
          "name": "tesla",
          "models": [
            "TEmodel1", "TEmodel2", "TEmodel3", "TEmodel4"
          ]
        },
        "M005":{
          "name": "kia",
          "models": [
            "KImodel1", "KImodel2", "KImodel3", "KImodel4"
          ]
        }
      }
      let manucarCount = 0;
      for (const manuID in manufacturers) {
        await stub.putState( manuID, Buffer.from(JSON.stringify(manufacturers[manuID])) )
        await stub.putState("emptystring", Buffer.from(''));
        // console.info("added manufacutrer details" + manuID + JSON.stringify(manufacturers[manuID]))
      }
      await stub.putState( "carCount", Buffer.from(manucarCount.toString()))
    }
    
    async getManuDetails(stub, manuID){
      const manuAsBYtes = await stub.getState(manuID);
        if (!manuAsBYtes || manuAsBYtes.length === 0) {
            throw new Error(`${manuID} does not exist`);
        }
        // console.log(manuAsBYtes.toString());
        return manuAsBYtes.toString();
    }

    async manufactureCar(stub, manuID, model, color){
      // if(this.manufacturers[manuID]["models"].indexOf(model)===-1){
      //   throw new Error(`the selected model ${ model } doesnt exist in the current manufacturer`);
      // }
      //remove this lines after testing
      model = manuID[1];
      color = manuID[2];
      manuID = manuID[0];
      //
      let carCountAsBytes = await stub.getState("carCount");
      let manufacturedByManu = await stub.getState("carsManufacturedBy"+manuID);
      if(manufacturedByManu.toString() === ''){
        manufacturedByManu = "[]"
      }
      let carCount = parseInt(carCountAsBytes.toString()) + 1;
      manufacturedByManu = JSON.parse(manufacturedByManu.toString());
      let manuAsBYtes = await stub.getState(manuID);
      manuAsBYtes = JSON.parse(manuAsBYtes.toString());
      let car = {
        "carID": carCount.toString(),
        "manu": manuAsBYtes["name"],
        "model": model,
        "color": color,
        "owner": manuID,
        "forSale": true,
        "dealer": "",
        "request": "" 
      }
    
      await stub.putState(carCount.toString(), Buffer.from(JSON.stringify(car)))
      await stub.putState("carCount", Buffer.from(carCount.toString()));
      manufacturedByManu.push(carCount.toString())
      await stub.putState("carsManufacturedBy"+manuID, Buffer.from(JSON.stringify(manufacturedByManu)))
      console.info("generated car with carID" + carCount.toString() + "and with details " + JSON.stringify(car))
    }

    async getManufactuerdCars(stub, manuID){

      //remove this lines after testing
      manuID = manuID[0]
      //

      let manufactureCars = await stub.getState("carsManufacturedBy"+manuID);
      manufactureCars = manufactureCars.toString();
      console.info("manfactured by "+manuID + " are "+ manufactureCars);
      return manufactureCars;
    }

    async requestManufacturer(stub, dealerID, carID){

      //remove this lines after testing
      carID = dealerID[1];
      dealerID = dealerID[0];
      //
      let carAsBytes = await stub.getState(carID.toString());
      let car = JSON.parse(carAsBytes.toString());
      car["request"] = dealerID;
      const manuID = car["owner"];
      await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
      //add to cars requested to manufacturer
      let carsRequested = await stub.getState("requestedto"+manuID);
      let emptystring = await stub.getState("emptystring");
      if(carsRequested.toString() === emptystring.toString()){
        carsRequested = [];
        carsRequested.push((carID));
      }
      else{
        carsRequested = JSON.parse(carsRequested.toString());
        carsRequested.push((carID));
      }
      await stub.putState("requestedto"+manuID, Buffer.from(JSON.stringify(carsRequested)));
      //remove from cars manufactured,so that no new requests can be made to the same car
      let carsManufacturedBy = await stub.getState("carsManufacturedBy"+manuID);
      if(carsManufacturedBy.toString() === emptystring.toString()){
        carsManufacturedBy = []
      }
      carsManufacturedBy = JSON.parse(carsManufacturedBy.toString());
      for( var i = 0; i < carsManufacturedBy.length; i++){   //removing carID from carsmanufactureded by manufacturer
        if ( carsManufacturedBy[i] === carID.toString()) {
          carsManufacturedBy.splice(i, 1); 
        }
      }
      await stub.putState("carsManufacturedBy"+manuID, Buffer.from(JSON.stringify(carsManufacturedBy)))
    }

    async getAllRequestedCars(stub, manuID){
      let carsRequested = await stub.getState("requestedto"+manuID)
      return carsRequested.toString();
    }

    async denyDealerRequest(stub, carID){
      //remove this lines after testing
      carID = carID[0]
      //
      let carAsBytes = await stub.getState(carID.toString());
      let emptystring = await stub.getState("emptystring");
      let car = JSON.parse(carAsBytes.toString());
      let manuID = car["owner"];
      car["request"] = '';
      await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
      //add the car back to the carsmanufactured list
      let manufacturedByManu = await stub.getState("carsManufacturedBy"+manuID);
      manufacturedByManu = manufacturedByManu.toString()
      if(manufacturedByManu === emptystring.toString() || manufacturedByManu === '[]'){
        manufacturedByManu = []
        manufacturedByManu.push(carID);
      }
      else{
        manufacturedByManu = JSON.parse(dealerCarsList.toString());
        manufacturedByManu.push(carID);        
      }
      await stub.putState("carsManufacturedBy"+manuID, Buffer.from(JSON.stringify(manufacturedByManu)));
      //remove the car from the requests list
      let requestedList = await stub.getState("requestedto"+manuID);
      if(requestedList.toString() === emptystring.toString() || requestedList === '[]'){
        requestedList = []
      }
      requestedList = JSON.parse(requestedList.toString());
      for( var i = 0; i < requestedList.length; i++){     //removing carID from requested list to manufacturer
        
        if ( requestedList[i] === parseInt(carID)) {
           requestedList.splice(i, 1); 
         }
      }
      await stub.putState("requestedto"+manuID, Buffer.from(JSON.stringify(requestedList)));
    }

    async acceptDealerRequest(stub, carID){
      //remove this lines after testing
      carID = carID[0];
      //

      let emptystring = await stub.getState("emptystring");
      let carAsBytes = await stub.getState(carID.toString());
      let car = JSON.parse(carAsBytes.toString());
      let manuID = car["owner"]
      car["owner"] = car["request"];
      car["request"] = '';
      await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
      let requestedList = await stub.getState("requestedto"+manuID);
      let dealerCarsList = await stub.getState("carsByDealers"+car["owner"]);
      if(dealerCarsList.toString() === emptystring.toString() || dealerCarsList === '[]'){
        dealerCarsList = []
        dealerCarsList.push(carID);
      }
      else{
        dealerCarsList = JSON.parse(dealerCarsList.toString());
        dealerCarsList.push(carID);        
      }
      if(requestedList.toString() === emptystring.toString() || requestedList === '[]'){
        requestedList = []
      }

      requestedList = JSON.parse(requestedList.toString());
      console.log(requestedList);
      for( var i = 0; i < requestedList.length; i++){     //removing carID from requested list to manufacturer
        
        if ( requestedList[i] === parseInt(carID)) {
           requestedList.splice(i, 1); 
         }
      }
      console.log(requestedList);
      await stub.putState("carsByDealers"+car["owner"], Buffer.from(JSON.stringify(dealerCarsList)));  //adding car to carsbydealers
      await stub.putState("requestedto"+manuID, Buffer.from(JSON.stringify(requestedList)));
    }

    async carsByDealers(stub, dealerID){
      //remove this lines after testing
      dealerID = dealerID[0];
      //

      let dealerCars = await stub.getState("carsByDealers"+dealerID);
      return dealerCars.toString();
    }

    async getCarDetails(stub, carID){
      //remove this lines after testing
      carID = carID[0];
      //
      let carAsBytes = await stub.getState(carID.toString());
      return carAsBytes.toString();
    }

    async requestToBuyFromDealer(stub, customerID, carID){

      //remove this lines after testing
      carID = customerID[1];
      customerID = customerID[0]
      //
      let emptystring = await stub.getState("emptystring");
      let carAsBytes = await stub.getState(carID.toString());
      let car = JSON.parse(carAsBytes.toString());
      car["request"] = customerID;
      const dealerID = car["owner"];
      await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
      //add the car to the list of dealer requests
      let carsRequested = await stub.getState("requestedToDealers"+dealerID);
      if(carsRequested.toString()===emptystring.toString() || carsRequested.toString()==='[]'){
        carsRequested = []
        carsRequested.push(carID);
      }
      else{
        carsRequested = JSON.parse(carsRequested.toString())
        carsRequested.push(carID);
      }
      await stub.putState("requestedToDealers"+dealerID, Buffer.from(JSON.stringify(carsRequested)));
      //remove car from list of dealers available cars
      let dealerCarsList = await stub.getState("carsByDealers"+dealerID);
      if(dealerCarsList.toString() === emptystring.toString() || dealerCarsList.toString()==='[]'){
        dealerCarsList = []
      }
      dealerCarsList = JSON.parse(dealerCarsList);
      for( var i = 0; i < dealerCarsList.length; i++){     //removing carID from dealers car list
        if ( dealerCarsList[i] === carID.toString()) {
          dealerCarsList.splice(i, 1); 
        }
      }
      await stub.putState("carsByDealers"+dealerID, Buffer.from(JSON.stringify(dealerCarsList)))
    }

    async requestsForDealer(stub, dealerID){
      //remove this lines after testing
      dealerID = dealerID[0]
      //
      let carsByDealers = await stub.getState("requestedToDealers"+dealerID);
      return carsByDealers.toString();
    }

    async denyCustomerRequest(stub, carID){
      //remove this lines after testing
      carID = carID[0];
      //
      let emptystring = await stub.getState("emptystring");
      let carAsBytes = await stub.getState(carID.toString());
      let car = JSON.parse(carAsBytes.toString());
      let dealerID = car["owner"];
      car["request"] = '';
      await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
      //add the car back to the dealers list
      let dealerCarsList = await stub.getState("carsByDealers"+dealerID);
      if(dealerCarsList.toString() === emptystring.toString() || dealerCarsList.toString() === '[]'){
        dealerCarsList = []
        dealerCarsList.push(carID);
      }
      else{
        dealerCarsList = JSON.parse(dealerCarsList.toString());
        console.log("dealers car list = "+dealerCarsList.toString());
        dealerCarsList.push(carID);
      }
      await stub.putState("carsByDealers"+dealerID, Buffer.from(JSON.stringify(dealerCarsList)));  //adding car to carsbydealers
      //remove the car from the dealers request list
      let carsRequested = await stub.getState("requestedToDealers"+dealerID);
      if(carsRequested.toString()=== emptystring.toString() || carsRequested.toString() === '[]'){
        carsRequested = []
      }
      carsRequested = JSON.parse(carsRequested.toString())
      for( var i = 0; i < carsRequested.length; i++){
        if ( carsRequested[i] === parseInt(carID)) {
          carsRequested.splice(i, 1); 
        }
      }
      await stub.putState("requestedToDealers"+dealerID, Buffer.from(JSON.stringify(carsRequested)));
    }

    async acceptCustomerRequest(stub, carID){
      //remove this lines after testing
      carID = carID[0];
      //
      let emptystring = await stub.getState("emptystring");
      let carAsBytes = await stub.getState(carID.toString());
      let car = JSON.parse(carAsBytes.toString());
      let dealerID = car["owner"];
      car["owner"] = car["request"];
      car["request"] = '';
      car['forSale'] = false;
      let customerID = car["owner"];
      await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
      let customerCarsList = await stub.getState("carsByCustomer"+customerID);
      if(customerCarsList.toString() === emptystring.toString() || customerCarsList.toString() === '[]'){
        customerCarsList = []
        customerCarsList.push(carID);
      }
      else{
        customerCarsList = JSON.parse(customerCarsList.toString());
        customerCarsList.push(carID);
      }
      console.log("customer cars = " + customerCarsList.toString());
      await stub.putState("carsByCustomer"+customerID, Buffer.from(JSON.stringify(customerCarsList)));
      let carsRequested = await stub.getState("requestedToDealers"+dealerID);
      if(carsRequested.toString()=== emptystring.toString() || carsRequested.toString() === '[]'){
        carsRequested = []
      }
      carsRequested = JSON.parse(carsRequested.toString())
      for( var i = 0; i < carsRequested.length; i++){
        if ( carsRequested[i] === parseInt(carID)) {
          carsRequested.splice(i, 1);
        }
      }
      await stub.putState("requestedToDealers"+dealerID, Buffer.from(JSON.stringify(carsRequested)));
    }

    async carsByCustomers(stub, customerID){
      //remove this lines after testing
      customerID = customerID[0]
      //
      let carsByCustomer = await stub.getState("carsByCustomer"+customerID);
      return carsByCustomer.toString();
    }
    //forSale
    // async sellTheCar(stub, carID){
    //   //remove this lines after testing
    //   carID = carID[0]
    //   //
    //   let emptystring = await stub.getState("emptystring");
    //   let carAsBytes = await stub.getState(carID.toString());
    //   let car = JSON.parse(carAsBytes.toString());
    //   car["request"] = '';
    //   car['forSale'] = true;
    //   await stub.putState(carID.toString(), Buffer.from(JSON.stringify(car)));
    //   let forSaleList = await stub.getState("forSale");
    //   let data = {}
    //   if(customerCarsList.toString() === emptystring.toString() || customerCarsList.toString() === '[]'){
    //     customerCarsList = []
        
    //     customerCarsList.push(carID);
    //   }
    //   else{
    //     customerCarsList = JSON.parse(customerCarsList.toString());
    //     customerCarsList.push(carID);
    //   }
    //   console.log("customer cars = " + customerCarsList.toString());
    //   await stub.putState("carsByCustomer"+customerID, Buffer.from(JSON.stringify(customerCarsList)));
    // }

} 

module.exports = Chaincode
//exporting the chaincode