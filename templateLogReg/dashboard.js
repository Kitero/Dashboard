$(document).ready(function() {
  var socket = io();

  var date = new Date();
  date = date.toISOString().split("T")[0];

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday = yesterday.toISOString().split("T")[0];

  socket.emit("widget", {type: "weather", id: 1, city:"paris", date: date});
  socket.emit("widget", {type: "nasa", id: 1, longitude: 2.3488, latitude: 48.8534, date: date});
  socket.emit("widget", {type: "nasa", id: 2, date: date});
  socket.emit("widget", {type: "nasa", id: 3, date: yesterday});
  socket.emit("widget", {type: "nasa", id: 4, date: date});

  document.getElementById("divPicOfTheDay").innerHTML = "<input id='inputPicOfTheDay' type='date' max=" + date + ">";
  document.getElementById("divPicSat").innerHTML = "<input id='inputPicSat' type='date' max=" + yesterday + ">";

  const minusOneDay = function(date) {
      day = Number(date.split("-")[2]);
      month = Number(date.split("-")[1]);
      year = Number(date.split("-")[0]);
      if (day != 1) {
        day = day - 1;
      } else {
        day = 28;
        if (month != 1) {
          month = month - 1;
        } else {
          month = 12;
          year = year - 1;
        }
      }
    return (year.toString() + "-" + month.toString() + "-" + day.toString());
  }

  socket.on('connect', function (socket) {
    });

  socket.on('widget', function (widget) {
      switch (widget.type) {
        case "weather":
          obj = JSON.parse(widget.obj)
          document.getElementById("cityDisp").innerHTML = obj.name;
          temp = obj.main.temp - 273,15;
          document.getElementById("tempDisp").innerHTML = (temp | 0) + "°Celsius";
          switch (obj.weather[0].main) {
            case "Rain":
              document.getElementById("weatherDisp").innerHTML = "Pluvieux"
              break;
            case "Sun":
              document.getElementById("weatherDisp").innerHTML = "Ensoleillé"
              break;
            case "Clouds":
              document.getElementById("weatherDisp").innerHTML = "Nuageux"
              break;
            case "Clear":
              document.getElementById("weatherDisp").innerHTML = "Ciel dégagé"
              break;
            default:
              document.getElementById("weatherDisp").innerHTML = ""
              break;
          }
          break;
        case "convert":
          document.getElementById("convertResultDisp").innerHTML = JSON.parse(widget.obj).result.amount;
          break;
        case "nasa":
          if (widget.id == 1) {
            var link = "<img src=" + JSON.parse(widget.obj).url + ">"
            document.getElementById("earthPicture").innerHTML = link;
          } else if (widget.id == 2) {
            document.getElementById("picOfTheDay").innerHTML = JSON.parse(widget.obj).title + "<br> <img src=" + JSON.parse(widget.obj).url + ">";
          } else if (widget.id == 3) {
            if (JSON.parse(widget.obj)[0] == undefined) {
              var dayMinusOne = new Date(minusOneDay(widget.date));
              dayMinusOne = dayMinusOne.toISOString().split("T")[0];
              socket.emit("widget", {type: "nasa", id: 3, date: dayMinusOne});
            } else {
              var dateUrl = widget.date.split("-")[0] + "/" + widget.date.split("-")[1] + "/" + widget.date.split("-")[2];
              if (document.getElementById("inputPosPicSat").value == 0) {
                var url = "https://epic.gsfc.nasa.gov/archive/natural/" + dateUrl + "/png/" + JSON.parse(widget.obj)[0].image + ".png";
              } else {
                var url = "https://epic.gsfc.nasa.gov/archive/natural/" + dateUrl + "/png/" + JSON.parse(widget.obj)[document.getElementById("inputPosPicSat").value].image + ".png";
              }
              document.getElementById("picOfSat").innerHTML = "<img src=" + url + ">";
            }
          } else if (widget.id == 4) {
            if (document.getElementById("inputPicOfMars").value != "") {
              document.getElementById("picOfMars").innerHTML = "<img src=" + JSON.parse(widget.obj).photos[document.getElementById("inputPicOfMars").value].img_src + ">";
            } else {
              document.getElementById("picOfMars").innerHTML = "<img src=" + JSON.parse(widget.obj).photos[0].img_src + ">";
            }
          }
          break;
      }
    });

  $("#convertButton").on("click", function(req, res) {
//    if (document.getElementById("convertBase").value == undefined || document.getElementById("convertBase").value)
    socket.emit("widget", {type:"convert",
    id: 1,
    source: document.getElementById("convertBase").value.split("-")[0],
    dest: document.getElementById("convertDest").value.split("-")[0],
    value: document.getElementById("convertInput").value,
    date: date});
  })

  // Modal display management
  $('.closeModal').on("click", function() {
    document.getElementById('confModal').style.display = "none";
  });
  $('#configuration').on("click", function () {
    document.getElementById('confModal').style.display = "block";
  });

  // only one box checkable
  $('.formattemp').on('change', function() {
    $('.formattemp').not(this).prop('checked', false);
    });

  //Submit parameters of weather widget
  $('#submitWeather').on("click", function () {
    socket.emit("widget", {type: "weather", id: 1, city:document.getElementById('cityInput').value, date: date});
  });

  $('#submitEarth').on("click", function () {
    if (document.getElementById('latEarthInput').value != undefined && document.getElementById('longEarthInput').value != undefined) {
      console.log(document.getElementById("longEarthInput").value);
      var longitude = document.getElementById('longEarthInput').value.replace(",", ".");
      var latitude = document.getElementById('latEarthInput').value.replace(",", ".");
      socket.emit("widget", {type: "nasa", id: 1, longitude: longitude, latitude: latitude, date: date});
    }
  });

  $('#submitPicOfTheDay').on("click", function () {
    if (document.getElementById("inputPicOfTheDay").value != "") {
      socket.emit("widget", {type: "nasa", id: 2, date: document.getElementById("inputPicOfTheDay").value});
    }
  });

  $('#submitPicSat').on("click", function () {
    if (document.getElementById("inputPicSat").value != "") {
      socket.emit("widget", {type: "nasa", id: 3, date: document.getElementById("inputPicSat").value});
    }
    else if (document.getElementById("inputPosPicSat").value != "") {
      socket.emit("widget", {type: "nasa", id: 3, date: yesterday});
    }
  });

  $('#submitPicOfMars').on("click", function () {
    if (document.getElementById("inputPicOfMars").value != "") {
      socket.emit("widget", {type: "nasa", id: 4, date: date});
      document.getElementById("titleMars").innerHTML = "Photo " + document.getElementById("inputPicOfMars").value + " du Mars Rover:"
    }
  });

});
