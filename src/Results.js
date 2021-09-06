import React, {useEffect, useState} from 'react';
import Axios from 'axios';
import './Results.css';
import { Col, Row, Form, Button } from "react-bootstrap";
import Cellcom from './images/cellcom.png';
import Hot from './images/hot.png';
import Bezeq from './images/bezeq.png';
import Unlimited from './images/unlimited.png';

function Results(props) {
    const titleFactory = (isFiber) => {
        if(isFiber) return (<h3 className="result-paragraph success"> מזל טוב ! <br />
                    נראה כי יש לכם סיבים
                    </h3>)
        else return (<h3 className="result-paragraph success"> אוי ואבוי. <br />
                    נראה שעדיין אין לכם סיבים.
                    </h3>)
    }
    return (
        <div className="results-container">
            <div className="row upper-row">
                <div className="col result-box bezeq">
                    <div className="company-logo-circle">
                        <img src={Bezeq} className="company-logo" />
                    </div>            
                    {props.bezeq ? titleFactory(true) : titleFactory(false)}
                </div>            
                <div className="col result-box cellcom">
                    <div className="company-logo-circle">
                        <img src={Cellcom} className="company-logo" />
                    </div>       
                    {props.cellcom ? titleFactory(true) : titleFactory(false)}
                </div>   
            </div>
            <div className="row lower-row">         
                <div className="col result-box hot">
                    <div className="company-logo-circle">
                        <img src={Hot} className="company-logo" />
                    </div>            
                    {props.hot ? titleFactory(true) : titleFactory(false)}
                </div>    
            </div>

        </div>
    );
}

export default Results;
