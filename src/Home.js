import React, {useEffect, useState} from 'react';
import Axios from 'axios';
import Select from 'react-select'
import './App.css';
import { Col, Row, Form, Button } from "react-bootstrap";
import cityList from './CityList.json';
import Modal from 'react-bootstrap/Modal'
import Results from './Results'
import abdev from './images/abdev.png'
import ReactLoading from "react-loading";

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
    const [loading, toggleLoading] = useState(false);
    const [loadingSelect, toggleLoadingSelect] = useState(false);
    const [entrances, setEntrances] = useState([]);
    const [streetSelected, setStreetSelected] = useState({
        "label": null,
        "value": null
    });
    const [streetSelectedCellcom, setStreetSelectedCellcom] = useState(null);
    const [streetStringArray, setStreetStringArray] = useState(null);
    const [equivalentStreetsArray, setEquivalentStreetsArray] = useState([]);
    const [houseSelected, setHouseSelected] = useState('');
    const [appSelected, setAppSelected] = useState(1);
    const [entSelected, setEntSelected] = useState('');
    const [isFiber, setIsFiber] = useState(false);
    const [isFiberCellcom, setIsFiberCellcom] = useState(false);
    const [isFiberBezeq, setIsFiberBezeq] = useState(false);
    const [checkDuplicates, setCheckDuplicates] = useState(false);
    const [streetsModal, toggleStreetsModal] = useState(false);
    const [showResults, toggleShowResults] = useState(false);

    useEffect(() => {
        if(streetSelected.value) findEquivalentCityID();
    }, [streetSelected])

    useEffect(() => {
        if(checkDuplicates && equivalentStreetsArray){
            let arr = removeDuplicates(equivalentStreetsArray);
            setCheckDuplicates(false)
            setEquivalentStreetsArray(arr);
        }
    }, [checkDuplicates, equivalentStreetsArray])

    useEffect(() => {   
        if(appSelected && houseSelected) handleSubmit()
    }, [appSelected, streetSelectedCellcom])

    const openModal = (e) => {
        e.preventDefault();
        if(equivalentStreetsArray.length > 0) toggleStreetsModal(true);
        else handleSubmit();
    }

    const handleSubmit = async () =>{
        try{
            toggleLoading(true);
            const responseHot = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/CheckAddressForFiber",
            {
                "CityId": city.value,
                "StreetId": streetSelected.value,
                "HouseId": houseSelected,
                "ApartmentID": appSelected,
                "Entrance": entSelected
            });
            if(responseHot) setIsFiber(responseHot.data.d.IsFiber);
            let street = streetSelectedCellcom ? streetSelectedCellcom.value : streetSelected.value
            const responseCell = await Axios.get("https://digital-api.cellcom.co.il/api/Fiber/GetFiberAddressStatus/"
                                    +city.value+"/"
                                    +street+"/"
                                    +houseSelected+"/"
                                    +appSelected);
            if(responseCell.data.Body.dataInfoList)
                setIsFiberCellcom(responseCell.data.Body.dataInfoList.length > 0 ? true : false);
            const responseBezeq = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.bezeq.co.il/umbraco/api/FormWebApi/CheckAddress",
            {

                "CityId": city.value,
                "City": city.label,
                "StreetId": streetSelected.value,
                "Street": streetSelected.label,
                "House": houseSelected,
                "Entrance": entSelected
            });
            if(responseBezeq) 
                if(responseBezeq.data.Status < 3)
                    setIsFiberBezeq(true);

            // const unlimitedResponse = await Axios.get("https://damp-hamlet-24907.herokuapp.com/https://www.unlimited.net.il/wp-json/api/v1/houses?city="+city.value+"&"+"street="+street)
            // if(unlimitedResponse)
            //     console.log(unlimitedResponse.data[0].id)
            toggleLoading(false);
            toggleShowResults(true);
        }
        catch (err) {
            console.error(err)
        }
    }

    const handleCitySelection = async (event) => {
        let cityId = event.value;
        let city = event;
        setCity(city);
        toggleLoadingSelect(true)
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
                toggleLoadingSelect(false)

            }
        }
        catch (err) {
        }
    }
    /*
        Check if there is a match between the street ID of the street chosen from HOT dataset, and from CELLCOM dataset.
    */
    const findEquivalentCityID = () => {
        let x, 
            duplicateCheckFlag = 1, 
            street, 
            streetArray = [];
        for(x = 0; x < streetsCellcom.length; x++){
            street = streetsCellcom[x];
            if(street.value === streetSelected.value){
                setStreetSelectedCellcom(streetSelected);
                setCheckDuplicates(false)
                duplicateCheckFlag = 0;
                break;
            }
        }
        /*
            If no exact match was found between HOT and CELLCOM streets ID, 
            find equivalent street from cellcom's dataset according to street label comparison.
        */
        if(duplicateCheckFlag){
            for(x = 0; x < streetsCellcom.length; x++){
                street = streetsCellcom[x]
                streetStringArray.forEach(element => { 
                    if(street.label.includes(element)){
                        streetArray.push(street)
                    }
                });
            }
            setCheckDuplicates(true)
            setEquivalentStreetsArray(streetArray)
        }
    }

    const handleStreetSelection = async (event) =>{
        let streetHOT = event;
        setStreetSelected(event);
        setStreetStringArray(event.label.split(" "));
        toggleLoadingSelect(true)
        try{
            const houseList = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/GetHouseByCityStreet",
            {
                "CityId": city.value,
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
                toggleLoadingSelect(false)

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
                return (<Button key={street.value} variant="primary" onClick={(e)=>{handleSelectEquivalentStreet(e,street)}}> {street.label} </Button>)
            })
            return (list)
        }
    }

    const handleAppSelection = (event) =>{
        setAppSelected(parseInt(event.target.value))
    }

    const handleEntranceSelection = async (event) =>{
        setEntSelected(event.target.value)
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
            <div className="container">
                <h1 className="main-title"> בדיקת סיבים אופטיים </h1>
                <h4 className="main-paragraph"> ברוכים הבאים לFiberLocator, הכלי הראשון והיחיד בישראל אשר מאפשר לכם לבדוק האם ישנה תשתית סיבים בכתובתכם של החברות הוט, בזק וסלקום, ללא צורך ביצירת קשר עם כל חברה בנפרד. </h4>
                <Form onSubmit={openModal} className="form-div">
                    <Row className="inputrow">
                        <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>בחר עיר</Form.Label>
                        {/* <Form.Select className="select-custom" defaultValue="Choose City" onChange={handleCitySelection}>
                            {cityList()}
                        </Form.Select> */}
                        <Select className='react-select-container' classNamePrefix="react-select" placeholder="בחר עיר" options={cityList} onChange={handleCitySelection} />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGridState">
                            <Form.Label>בחר רחוב</Form.Label>
                            <Select className='react-select-container' placeholder="בחר רחוב" classNamePrefix="react-select" options={streets} onChange={handleStreetSelection} />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGridState">
                            <Form.Label>בחר בית</Form.Label>
                            <Select className='react-select-container' classNamePrefix="react-select" placeholder="בחר בית" options={houses} onChange={handleHouseSelection} />
                        </Form.Group>
                        {/* <Form.Group as={Col} controlId="formGridState">
                            <Form.Label>Appartment</Form.Label>
                            <Form.Control className='appartment-input' onChange={handleAppSelection} type="text" defaultValue="1" />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGridState">
                            <Form.Label>Entrances</Form.Label>
                            <Select className='react-select-container' classNamePrefix="react-select" options={entrances} onChange={handleEntranceSelection} />
                        </Form.Group> */}
                        <Button variant="primary" type="submit" className={loading ? "btn-primary loader" : "btn-primary"}>
                            בדוק חיבור
                        </Button>
                        {loadingSelect ? <ReactLoading className="loading-spinner" type="spin" color="#fff" /> : null}

                    </Row>
                </Form>
                { showResults ? <Results cellcom={isFiberCellcom} hot={isFiber} bezeq={isFiberBezeq} /> : null}
                <a href="https://github.com/alonilk2"><img src={abdev} className="abdev" /></a>
            </div>
        </div>
    );
}

export default Home;
