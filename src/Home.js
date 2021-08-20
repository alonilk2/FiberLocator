import React, {useEffect, useState} from 'react';
import Axios from 'axios';
import Select from 'react-select'
import './App.css';
import { Col, Row, Form, Button } from "react-bootstrap";
import cityList from './CityList';
import Modal from 'react-bootstrap/Modal'
function removeDuplicates(arr){
    let i=0, x=0;
    for(i=0; i<arr.length-1; i++){
        for(x=1; x<arr.length; x++){
            if(arr[i].value === arr[x].value)
                arr.splice(x, 1);
        }
    }
    return arr;
}
function Home() {

    const [city, setCity] = useState('');
    const [streets, setStreetsHOT] = useState([]);
    const [streetsCellcom, setStreetsCellcom] = useState([]);
    const [houses, setHouses] = useState([]);
    const [apps, setApps] = useState([]);
    const [entrances, setEntrances] = useState([]);
    const [streetSelected, setStreetSelected] = useState({
        "label": null,
        "value": null
    });
    const [streetSelectedCellcom, setStreetSelectedCellcom] = useState(null);
    const [streetStringArray, setStreetStringArray] = useState(null);
    const [equivalentStreetsArray, setEquivalentStreetsArray] = useState([]);
    const [houseSelected, setHouseSelected] = useState('');
    const [appSelected, setAppSelected] = useState('');
    const [entSelected, setEntSelected] = useState('');
    const [isFiber, setIsFiber] = useState('');
    const [checkDuplicates, setCheckDuplicates] = useState(false);
    const [streetsModal, toggleStreetsModal] = useState(false);
    useEffect(() => {
        if(streetSelected.value)
            findEquivalentCityID();
    }, [streetSelected])

    useEffect(() => {
        if(checkDuplicates && equivalentStreetsArray){
            let arr = removeDuplicates(equivalentStreetsArray);
            setCheckDuplicates(false)
            setEquivalentStreetsArray(arr);
        }
    }, [checkDuplicates, equivalentStreetsArray])
    useEffect(() => {   
        if(streetSelected && streetSelectedCellcom)
            handleSubmit()
    }, [streetSelectedCellcom, streetSelected])
    const openModal = (e) => {
        e.preventDefault();
        if(equivalentStreetsArray.length > 0){
            console.log("גו")
            toggleStreetsModal(true);
        }
        else handleSubmit();
    }
    const handleSubmit = async () =>{
        try{
            const responseHot = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/CheckAddressForFiber",
            {
                "CityId": city,
                "StreetId": streetSelected.value,
                "HouseId": houseSelected,
                "ApartmentID": appSelected,
                "Entrance": entSelected
            });
            if(responseHot) {
                console.log("HOT: "+responseHot.data.d.IsFiber+" val:"+streetSelected.value)
                setIsFiber(responseHot.data.d.IsFiber);
            }
            console.log(streetSelectedCellcom)
            const responseCell = await Axios.get("https://damp-hamlet-24907.herokuapp.com/https://digital-api.cellcom.co.il/api/Fiber/GetFiberAddressStatus/"
                                    +city+"/"
                                    +streetSelectedCellcom.value+"/"
                                    +houseSelected+"/");
            if(responseCell) {
                console.log(responseCell.data.Body.entryList.length > 0 ? true : false)
                setIsFiber(responseCell);
            }
        }
        catch (err) {
            console.log(err)
        }


    }
    const handleCitySelection = async (event) => {
        event.preventDefault();
        let cityId = event.target.value;
        setCity(parseInt(cityId))
        try{
            const streetsList = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/GetstreetsByCityId",
            {
                "CityId": cityId
            });
            const streetsListCellcom = await Axios.get("https://damp-hamlet-24907.herokuapp.com/https://digital-api.cellcom.co.il/api/Address/GetStreets/"+cityId);
            if(streetsList && streetsListCellcom) {
                const options = streetsList.data.d.map((street) =>{
                    return {
                        value: street.StreetID,
                        label: street.StreetName
                    }
                })
                const optionsCellcom = streetsListCellcom.data.Body.map((street) =>{
                    return {
                        value: street.streetSemel,
                        label: street.streetName
                    }
                })
                setStreetsHOT(options);
                setStreetsCellcom(optionsCellcom);
            }
        }
        catch (err) {
        }
    }
    const findEquivalentCityID = () => {
        streetsCellcom.forEach(street => {
            //console.log("val:"+street.value+"label:"+street.label);
            if(street.value === streetSelected.value){
                setStreetSelectedCellcom(streetSelected);
            }
            else {
                /*
                    For each part of the selected street label, we compare with all streets of cellcom
                    then we'll display all matches to the user for second verification
                */
                streetStringArray.forEach(element => { 
                    if(street.label.includes(element)){
                        setEquivalentStreetsArray(oldarray => [...oldarray, street])
                    }
                });
                setCheckDuplicates(true);
            }
        });
    }
    const handleStreetSelection = async (event) =>{
        let streetHOT = event; // from HOT array: value (streetID) + label
        setStreetSelected(event);
        setStreetStringArray(event.label.split(" "));
        try{
            const houseList = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/GetHouseByCityStreet",
            {
                "CityId": city,
                "StreetId": event.value
            });
            if(houseList) {
                const options = houseList.data.d.map((house) =>{
                    return {
                        value: house,
                        label: house
                    }
                })
                setHouses(options);
            }
        }
        catch (err) {
        }
    }
    const handleHouseSelection = async (event) =>{
        setHouseSelected(event.value)
        try{
            const appList = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/GetHouseByCityStreetAndHouseNumber",
            {
                "CityId": city,
                "StreetId": streetSelected,
                "HouseId": event.value
            });
            if(appList) {
                const appartments = appList.data.d.Apartments.map((house) =>{
                    return {
                        value: house,
                        label: house
                    }
                })
                const entrances = appList.data.d.Entrances.map((house) =>{
                    return {
                        value: house,
                        label: house
                    }
                })
                setApps(appartments)
                setEntrances(entrances)
                console.log(appartments)
                console.log(entrances)

            }
        }
        catch (err) {
        }
    }
    const handleSelectEquivalentStreet = (e, street) => {
        setStreetSelectedCellcom(street);
        toggleStreetsModal(false);
        setEquivalentStreetsArray(null);
    }
    const renderEquivalentList = () => {
        if(equivalentStreetsArray){
            const list = equivalentStreetsArray.map((street) => {
                return (<Button variant="primary" onClick={(e)=>{handleSelectEquivalentStreet(e,street)}}> {street.label} </Button>)
            })
            return (list)
        }
    }
    const handleAppSelection = async (event) =>{
        setAppSelected(event.value)
    }
    if(streetsModal){
        return(
            <Modal.Dialog>
                <Modal.Header closeButton>
                    <Modal.Title>Modal title</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {renderEquivalentList()}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary">Close</Button>
                    <Button variant="primary">Save changes</Button>
                </Modal.Footer>
            </Modal.Dialog>
        )
    }
    return (
        <div className="App">
            <Form onSubmit={openModal}>
                <Row className="mb-3 inputrow">
                    <Form.Group as={Col} controlId="formGridState">
                    <Form.Label>City</Form.Label>
                    <Form.Select defaultValue="Choose City" onChange={handleCitySelection}>
                        {cityList()}
                    </Form.Select>
                    </Form.Group>
                    <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>Street</Form.Label>
                        <Select options={streets} onChange={handleStreetSelection} />
                    </Form.Group>
                    <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>House</Form.Label>
                        <Select options={houses} onChange={handleHouseSelection} />
                    </Form.Group>
                    <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>Appartment</Form.Label>
                        <Select options={apps} onChange={handleAppSelection} />
                    </Form.Group>
                    <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>Entrances</Form.Label>
                        <Select options={entrances} onChange={handleAppSelection} />
                    </Form.Group>
                </Row>
                <Button variant="primary" type="submit">
                    בדוק חיבור
                </Button>
                <h2> חיבור: {isFiber ? "YES" : isFiber} </h2>
            </Form>
        </div>
    );
}

export default Home;
