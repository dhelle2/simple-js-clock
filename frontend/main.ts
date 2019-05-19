import "./main.scss";
import "../public/images/asfalt-light.png";

const busStops = ["6700", "6627", "307", "332", "4640", "14487", "6347", "206"];
const trainStations = ["40350"];
const city = "Chicago";

interface CtaBusPrediction {
    "tmstmp": string;
    "typ": string;
    "stpnm": string;
    "stpid": string;
    "vid": string;
    "dstp": number;
    "rt": string;
    "rtdd": string;
    "rtdir": "Eastbound" | "Westbound" | "Northbound" | "Southbound";
    "des": string;
    "prdtm": string;
    "tablockid": string;
    "tatripid": string;
    "dly": boolean;
    "prdctdn": string;
    "zone": string;
}

interface CtaBusError {
    "stpid": string;
    "msg": string;
}

interface CtaBusPredictions {
    "bustime-response": {
        "prd": CtaBusPrediction[];
        "error"?: CtaBusError[];
    };
}

interface CtaTrainPrediction {
    "staId": string;
    "stpId": string;
    "staNm": string;
    "stpDe": string;
    "rn": string;
    "rt": string;
    "destSt": string;
    "destNm": string;
    "trDr": string;
    "prdt": Date;
    "arrT": Date;
    "isApp": string;
    "isSch": string;
    "isDly": string;
    "isFlt": string;
    "flags": boolean;
    "lat": string;
    "lon": string;
    "heading": string;
}

interface CtaTrainPredictions {
    "ctatt": {
        "tmst": string;
        "errCd": string;
        "errNm": number;
        "eta": CtaTrainPrediction[];
    };
}

interface Weather {
    "id": number;
    "main": string;
    "description": string;
    "icon": string;
}

interface WeatherMain {
    "temp": number;
    "pressure": number;
    "humidity": number;
    "temp_min": number;
    "temp_max": number;
}

interface WeatherForecast {
    "weather": Weather[];
    "main": WeatherMain;
}

const timeElement = document.getElementById("time")
const dateElement = document.getElementById("date")

function addZero(i: number): string {
    if (i < 10) return "0" + i;
    return i.toString();
}

function startTime(): void {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const hour = today.getHours();
    const min = addZero(today.getMinutes());
    const sec = addZero(today.getSeconds());
    const date = addZero(today.getDate());
    const month = addZero(today.getMonth() + 1);
    const year = today.getFullYear();
    const day = days[today.getDay()];
    const hourstr = addZero((hour > 12) ? (hour - 12) : hour);
    
    // set time
    timeElement.innerHTML = `${hourstr}:${min}:${sec}`;
    
    // set date
    dateElement.innerHTML = `${day}, ${month}/${date}/${year}`;
    setTimeout(startTime, 500);
}

let curOpacity = 1;
function setOpacity(): void {
    if (curOpacity == 0) {
        curOpacity = 1;
        document.querySelector<HTMLDivElement>("#cta").style.display = "none";
        document.querySelector<HTMLDivElement>("#map").style.display = "block";
        document.querySelector<HTMLDivElement>("#cta").style.opacity = `${0}`;
        document.querySelector<HTMLDivElement>("#map").style.opacity = `${curOpacity}`;
    } else {
        curOpacity = 0;
        document.querySelector<HTMLDivElement>("#cta").style.display = "block";
        document.querySelector<HTMLDivElement>("#map").style.display = "none";
        document.querySelector<HTMLDivElement>("#cta").style.opacity = `${1}`;
        document.querySelector<HTMLDivElement>("#map").style.opacity = `${curOpacity}`;
    }

} setInterval(setOpacity, 15000);

function getData(): void {
    document.querySelector<HTMLDivElement>("#bus").innerHTML = "";
    fetch(`http://localhost:8080/api/ctaBus?bus=${busStops.join(",")}`).then((res): Promise<CtaBusPredictions> => res.json()).then((result): void => {
        const timeNow = new Date();
        for (let i = 0; i < result["bustime-response"].prd.length; i++) {
            const timeFromApi = result["bustime-response"].prd[i].prdtm;
            const prdTime = new Date(timeFromApi.slice(0, 4) + "/" + timeFromApi.slice(4, 6) + "/" + timeFromApi.slice(6, 16));
            const eta = Math.floor(Math.abs(prdTime.valueOf() - timeNow.valueOf()) / 1000 / 60);
            document.querySelector<HTMLDivElement>("#bus").innerHTML += "<li><i class='fa fa-bus'></i><span class=route>" + result["bustime-response"].prd[i].rt + "</span><span class=direction>" + result["bustime-response"].prd[i].rtdir + "</span><span class=eta>" + eta + " min</span></li>";
        }
    });
    
    document.querySelector<HTMLDivElement>("#train").innerHTML = "";
    for (let i = 0; i < trainStations.length; i++) {
        fetch(`http://localhost:8080/api/ctaTrain?train=${trainStations[i]}`).then((res): Promise<CtaTrainPredictions> => res.json()).then((result): void => {
            const timeNow = new Date();
            for (let j = 0; j < result.ctatt.eta.length; j++) {
                const prdTime = new Date(result.ctatt.eta[j].arrT);
                const eta = Math.floor(Math.abs(prdTime.valueOf() - timeNow.valueOf()) / 1000 / 60);
                document.querySelector<HTMLDivElement>("#train").innerHTML += "<li><i class='fa fa-train'></i><span class=route>" + result.ctatt.eta[j].rt + "</span><span class=direction>" + result.ctatt.eta[j].destNm + "</span><span class=eta>" + eta + " min<span></li>";
            }
        });
    }

    setOpacity();

    fetch(`http://localhost:8080/api/weather?city=${city}`).then((res): Promise<WeatherForecast> => res.json()).then((result): void => {
        const temp = result.main.temp;
        const tempF = Math.round(temp * 9 / 5 - 459.67);
        const tempC = Math.round(temp - 273.15);
        document.querySelector<HTMLDivElement>("#weather-icon").className = "owi owi-" + result.weather[0].icon;
        document.querySelector<HTMLDivElement>("#weather-condition").innerHTML = result.weather[0].main;
        document.querySelector<HTMLDivElement>("#weather-temperature").innerHTML = tempF + "&#176;F<br>" + tempC + "&#176;C";
    });
    setTimeout(getData, 60000);
}

function updateEta(): void {
    const time = document.querySelectorAll<HTMLDivElement>("li>.eta");
    const timeNow = new Date();
    for (let i = 0; i < time.length; i++) {
        const arrival = time[i].innerHTML;
        const eta = parseInt(arrival.split(":")[0] + arrival.split(":")[1]) - parseInt(addZero(timeNow.getHours()) + "" + addZero(timeNow.getMinutes()));
        time[i].innerHTML = eta + " min";
    }
    setTimeout(updateEta, 60000);
}


startTime();
getData();