import React, {useEffect, useState} from 'react';
import Axios from 'axios';
import Select from 'react-select'
import './App.css';
import { Col, Row, Form, Button } from "react-bootstrap";
import cityList from './CityList.json';
import Modal from 'react-bootstrap/Modal'
import Results from './Results'
import Privacy from './Privacy'
import abdev from './images/abdev.png'
import ReactLoading from "react-loading";
import Global from './Globals.js';
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
    const [showResults, toggleShowResults] = useState(true);
    const [privacyPage, togglePrivacyPage] = useState(false);

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
            togglePrivacyPage(false);
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
        setEquivalentStreetsArray('');
        handleSubmit();
    }

    const renderEquivalentList = () => {
        if(equivalentStreetsArray){
            const list = equivalentStreetsArray.map((street) => {
                return (<Button key={street.value} variant="primary" className="street-button" onClick={(e)=>{handleSelectEquivalentStreet(e,street)}}> {street.label} </Button>)
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
    const reRender = () => {
        console.log("yes")
        togglePrivacyPage(false);
    }
    if(streetsModal){
        return(
            <Modal.Dialog>
                <Modal.Header closeButton>
                    <Modal.Title>בוא\י נוודא שמצאנו את הרחוב הנכון...</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderEquivalentList()}
                </Modal.Body>
            </Modal.Dialog>
        )
    }
    return (
        <div className="blurer">
            <div className={showResults === false ? "is-shown" : "container"}>
                <h1 className="row main-title">בדיקת סיבים אופטיים</h1>
                <h4 className="row main-paragraph"> ברוכים הבאים לFiberLocator, הכלי הראשון והיחיד בישראל אשר מאפשר לכם לבדוק האם ישנה תשתית סיבים בכתובתכם של החברות הוט, בזק וסלקום, ללא צורך ביצירת קשר עם כל חברה בנפרד. </h4>
                <Form onSubmit={openModal} className="row form-div">
                    <div className="inputrow">
                        <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>בחר עיר</Form.Label>
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

                        <Button variant="primary" type="submit" className={loading ? "btn-primary loader" : "btn-primary"}>
                            {loading ? "אנא המתן..." : "בדוק חיבור"}
                        </Button>
                        {loadingSelect || loading ? <ReactLoading className="row loading-spinner" type="spin" color="#fff" /> : <ReactLoading className="row loading-spinner-hidden" type="spin" color="#fff" />}
                        <a href="https://github.com/alonilk2"><img src={abdev} className="row abdev" /></a>
                        <h4 className="copyright"> כל הזכויות שמורות Ⓒ </h4>
                        <button className="copyright bold" type="button" onClick={(e)=>{Global.ShowPrivacy = true; togglePrivacyPage(true)}}> תקנון שימוש ופרטיות </button>
                        <h4 className="row footer-paragraph mp-bold"><br /> שימו לב! FiberLocator הינו מיזם פרטי אשר איננו משתייך לאף אחת מהחברות הרשומות לעיל. אין בעלי האתר אחראיים על נכונות ועדכניות המידע המוצג למשתמש. המידע הנאסף לצורך ביצוע בדיקת התשתית אינו נשמר במאגרי המידע של האתר, ומועבר בשלמותו לטיפול האתרים של החברות הנ"ל. למידע נוסף יש לקרוא את תנאי השימוש. </h4>

                    </div>
                </Form>

            </div>
            { showResults ? 
                <div className="results">
                    <Results cellcom={isFiberCellcom} hot={isFiber} bezeq={isFiberBezeq} />
                    <button className="new-test" onClick={()=>{toggleShowResults(false)}}>
                        הרץ בדיקה חדשה
                    </button>
                </div>
             : null }
            { privacyPage ? 
                <div>
                    <Privacy toggle={reRender}/>
                </div>
             : null }
        </div>
    );
}

export default Home;
