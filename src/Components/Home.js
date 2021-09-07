import React, {useEffect, useState} from 'react';
import Axios from 'axios';
import Select from 'react-select'
import '../CSS/App.css';
import { Col, Row, Form, Button } from "react-bootstrap";
import cityList from '../Utils/CityList.json';
import Modal from 'react-bootstrap/Modal';
import Results from '../Components/Results';
import Privacy from '../Components/Privacy';
import abdev from '../images/abdev.png';
import ReactLoading from "react-loading";
import Global from '../Utils/Globals.js';
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
    const [city, setCity] = useState(null);
    const [streets, setStreetsHOT] = useState([]);
    const [streetsCellcom, setStreetsCellcom] = useState([]);
    const [houses, setHouses] = useState([]);
    const [apps, setApps] = useState([]);
    const [loading, toggleLoading] = useState(false);
    const [loadingSelect, toggleLoadingSelect] = useState(false);
    const [entrances, setEntrances] = useState([]);
    const [streetSelected, setStreetSelected] = useState(null);
    const [streetSelectedCellcom, setStreetSelectedCellcom] = useState(null);
    const [streetStringArray, setStreetStringArray] = useState(null);
    const [equivalentStreetsArray, setEquivalentStreetsArray] = useState([]);
    const [houseSelected, setHouseSelected] = useState(null);
    const [appSelected, setAppSelected] = useState(1);
    const [entSelected, setEntSelected] = useState(null);
    const [isFiber, setIsFiber] = useState(false);
    const [isFiberCellcom, setIsFiberCellcom] = useState(false);
    const [isFiberBezeq, setIsFiberBezeq] = useState(false);
    const [checkDuplicates, setCheckDuplicates] = useState(false);
    const [streetsModal, toggleStreetsModal] = useState(false);
    const [showResults, toggleShowResults] = useState(false);
    const [privacyPage, togglePrivacyPage] = useState(false);
    const [newTest, toggleNewTest] = useState(false);
    const [notChosen, toggleNotChosen] = useState(false);
    const [actionFired, toggleActionFired] = useState(false);
    useEffect(() => {
                console.log("1")

        if(streetSelected) findEquivalentCityID();
    }, [streetSelected])
    useEffect(() => {
                console.log("2")
        if(streetSelectedCellcom && houseSelected && !newTest && actionFired) handleSubmit();
    }, [streetSelectedCellcom])
    useEffect(() => {
                console.log("3")

        if(checkDuplicates && equivalentStreetsArray){
            let arr = removeDuplicates(equivalentStreetsArray);
            setCheckDuplicates(false)
            setEquivalentStreetsArray(arr);
        }
    }, [checkDuplicates, equivalentStreetsArray])
    const openModal = (e) => {
        e.preventDefault();
        toggleActionFired(true)
        if(equivalentStreetsArray.length > 0) toggleStreetsModal(true);
        else handleSubmit();
    }
    const handleSubmit = async () =>{

        if(!city || !streetSelected || !houseSelected)
            toggleNotChosen(true)
        else {
            try{
                toggleLoading(true);
                const responseHot = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.hot.net.il/Api/PersonalDetails.asmx/CheckAddressForFiber",
                {
                    "CityId": city.value,
                    "StreetId": streetSelected.value,
                    "HouseId": houseSelected.value,
                    "ApartmentID": appSelected,
                    "Entrance": entSelected
                });
                if(responseHot) setIsFiber(responseHot.data.d.IsFiber);
                let street = streetSelectedCellcom ? streetSelectedCellcom.value : streetSelected.value
                const responseCell = await Axios.get("https://digital-api.cellcom.co.il/api/Fiber/GetFiberAddressStatus/"
                                        +city.value+"/"
                                        +street+"/"
                                        +houseSelected.value+"/"
                                        +appSelected);
                let dataList = responseCell.data.Body.dataInfoList;
                if(dataList && dataList.length > 0 && dataList[0].tashtitType === "FIBER")
                    setIsFiberCellcom(true);
                const responseBezeq = await Axios.post("https://damp-hamlet-24907.herokuapp.com/https://www.bezeq.co.il/umbraco/api/FormWebApi/CheckAddress",
                {

                    "CityId": city.value,
                    "City": city.label,
                    "StreetId": street.toString(),
                    "Street": streetSelected.label,
                    "House": houseSelected.value.toString(),
                    "Entrance": ""
                });
                if(responseBezeq) 
                    if(responseBezeq.data.Status < 3 && responseBezeq.data.Status > 0)
                        setIsFiberBezeq(true);
                toggleLoading(false);
                toggleShowResults(true);
                togglePrivacyPage(false);
            }
            catch (err) {
                console.error(err)
            }
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
            console.error(err);
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
                    if(street.label.includes(element))
                        streetArray.push(street);
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
            console.error(err)
        }
    }
    const handleHouseSelection = async (event) =>{
        setHouseSelected({"label": event.value, "value": event.value})
        toggleNotChosen(false)
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
            console.error(err)
        }
    }
    const handleSelectEquivalentStreet = (e, street) => {
        setStreetSelectedCellcom(street);
        toggleStreetsModal(false);
        setEquivalentStreetsArray('');
    }
    const handleSelectNewTest = () => {
        setIsFiber(false);
        setIsFiberCellcom(false);
        setIsFiberBezeq(false);
        toggleActionFired(false);
        toggleShowResults(false);
        toggleNewTest(true);
        setHouseSelected(null);
    }
    // If not exact match was found between streets ID in HOT and CELLCOM db's,
    // create a list of street's for final validation by the user.
    const renderEquivalentList = () => {
        if(equivalentStreetsArray){
            const list = equivalentStreetsArray.map((street) => {
                return (<Button key={street.value} variant="primary" className="street-button" onClick={(e)=>{handleSelectEquivalentStreet(e,street)}}> {street.label} </Button>)
            })
            return (list)
        }
    }
    const renderEquivalentStreetsModal = () => {
        return (            
        <Modal.Dialog>
            <Modal.Header closeButton>
                <Modal.Title>בוא\י נוודא שמצאנו את הרחוב הנכון...</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {renderEquivalentList()}
            </Modal.Body>
        </Modal.Dialog>)
    }
    return (
        <div className="blurer">
            <div className={showResults === false ? "is-shown" : "container"}>
                <h1 className="row main-title">בדיקת סיבים אופטיים</h1>
                <h4 className="row main-paragraph"> ברוכים הבאים לFiberLocator, הכלי הראשון והיחיד בישראל אשר מאפשר לכם לבדוק האם ישנה תשתית סיבים בכתובתכם של החברות הוט, בזק וסלקום, ללא צורך ביצירת קשר עם כל חברה בנפרד. </h4>
                { notChosen ? <h4 className="error-message"> יש לבחור ערך בכל השדות הנדרשים. </h4> : null }
                <Form onSubmit={openModal} className="row form-div">
                    <div className="inputrow">
                        <Form.Group as={Col} controlId="formGridState">
                        <Form.Label>בחר עיר</Form.Label>
                        <Select className='react-select-container' classNamePrefix="react-select" value={city} placeholder="בחר עיר" options={cityList} onChange={handleCitySelection} />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGridState">
                            <Form.Label>בחר רחוב</Form.Label>
                            <Select className='react-select-container' placeholder="בחר רחוב" value={streetSelected} classNamePrefix="react-select" options={streets} onChange={handleStreetSelection} />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGridState">
                            <Form.Label>בחר בית</Form.Label>
                            <Select className='react-select-container' classNamePrefix="react-select" value={houseSelected} placeholder="בחר בית" options={houses} onChange={handleHouseSelection} />
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
            { streetsModal ?
                renderEquivalentStreetsModal()
                : null
            }
            { showResults ? 
                <div className="results">
                    <Results cellcom={isFiberCellcom} hot={isFiber} bezeq={isFiberBezeq} />
                    <button className="new-test" onClick={()=>handleSelectNewTest()}>
                        הרץ בדיקה חדשה
                    </button>
                </div>
             : null }
            { privacyPage ? 
                <div className="privacy">>
                    <Privacy toggle={() => togglePrivacyPage(false)}/>
                </div>
             : null }
        </div>
    );
}

export default Home;
