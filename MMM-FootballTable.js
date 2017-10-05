/* global Module */
/* Magic Mirror
 * Module: MMM-FootballTable
 *
 * By Lasse Wollatz https://github.com/GHLasse/MMM-FootballTable
 * MIT Licensed.
 */
Module.register('MMM-FootballTable', {
  defaults: {
    maximumEntries: 9, //maximum number of table rows
    lblAsText: false, //REMOVE? Displays Table Header as Text
    leagueid: 0, // league ID as given by api.football-data.org
    interest: [], // names of clubs you follow
    showColor: false, //show club crests in colour?
    maxNameLength: 0, //0 = full club name, otherwise attempts to shorten it in a smart way to the length specified.
    showCrests: false, //show the crest of the club instead of the name (doesn't work for all clubs)
    //showCountry: true,
    showWhenError: true, //if set to false will hide the module in case of an error in the apis return message (e.g. too many requests)
    fade: true,
    fadePoint: 0.1,
    animationSpeed: 3,
    updateInterval: 120, //how often to request new results in minutes (set high since there are limited number of requests per week!)
    language: config.language, //doesn't have any impact at the moment
    apiBase: 'http://api.football-data.org/v1/competitions/',
    apiEndpoint: '/leagueTable',
    debug: false
  },
  start: function() {
    Log.info('Starting module: ' + this.name);
    this.loaded = false;
    this.respheader = {};
    this.url = this.config.apiBase + this.config.leagueid.toString() + this.config.apiEndpoint;
    this.update();
    setInterval(
        this.update.bind(this),
        this.config.updateInterval * 60 * 1000);
  },
  update: function() {
        if (this.config.leagueid == 0){
          var currentTime = new Date();
          var year = currentTime.getFullYear();
          this.sendSocketNotification(
            'FOOTBALL_REQUEST', {
                id: this.identifier,
                url: this.config.apiBase + "?season=" + year.toString()
            }
          );
        }else{
          this.sendSocketNotification(
            'FOOTBALL_REQUEST', {
                id: this.identifier,
                url: this.config.apiBase + this.config.leagueid.toString() + this.config.apiEndpoint
            }
          );
        }
        if (this.config.debug){
          this.sendNotification("SHOW_ALERT", { timer: 3000, title: "FOOTBALL", message: "update"});
        }
  },
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'FOOTBALL_RESPONSE' && payload.id === this.identifier) {
        Log.info('received' + notification);
        if (this.config.debug){
          this.sendNotification("SHOW_ALERT", { timer: 3000, title: "FOOTBALL", message: "received update" + payload.header});
        }
        if(payload.data){ //&& payload.data.status === "OK"
            this.loaded = true;
            this.data = payload.data;
            this.respheader = payload.header;
            this.error = payload.status;
            this.updateDom(this.config.animationSpeed * 1000);
        }else{
            this.loaded = true;
            this.sendNotification("SHOW_ALERT", { timer: 3000, title: "ERROR ", message: payload.data[0]});
            this.error = payload.data;
            this.respheader = payload.header;
            this.data = payload.data;
            this.updateDom(this.config.animationSpeed * 1000);
        }
    }
  },
  getStyles: function() {
    return ["football.css","flags.css"]; //flags not needed
  },
  getScripts: function() {
        return ["moment.js"]; //not needed
  },
  getTranslations: function() {
    return {
        de: "i18n/de.json",
        en: "i18n/en.json"
    };
  },
  getDom: function() {
    /* main function creating HTML code to display*/
    var wrapper = document.createElement("div");
    wrapper.className = "small dimmed";
    if (!this.data) {
        /*if not loaded, display message*/
        wrapper.innerHTML = this.translate("NAN_TEAMS");
        wrapper.className = "small dimmed";
        if(!this.config.showWhenError){
          this.hide();
        }
    }else if (!this.loaded) {
        /*if data is empty*/
        wrapper.innerHTML = this.translate("LOADING_DATA");
        wrapper.className = "small dimmed";
    }else if (this.error != 200) {
        /*if error*/
        wrapper.innerHTML = "ERROR " + this.error + ": " + this.translate("ERR"+this.error);
        wrapper.innerHTML += "<br>" + this.translate("CHECKOUT") + " " + "http://api.football-data.org/docs/v1/index.html" + " " + this.translate("MOREINF");
        wrapper.innerHTML += "<br>Requests Left: " + this.respheader.headers["x-requests-available"];
        wrapper.innerHTML += "<br>Counter Reset in " + (Math.round(parseFloat(this.respheader.headers["x-requestcounter-reset"])/3600)).toString() + "h";
        wrapper.className = "small dimmed error";
        //http://api.football-data.org/docs/v1/index.html#_errors
        if(!this.config.showWhenError){
          this.hide();
        }
    }else if (this.config.leagueid == 0) {
        /*if no league specified*/
        var table = document.createElement("table");
        var countryArray = [];
        
        /*table header*/
        var th = document.createElement("tr");
        var thPlace = document.createElement("td");
        thPlace.className = "small label";
        thPlace.innerHTML = "ID"; //Pos
        th.appendChild(thPlace);
        var thName = document.createElement("td");
        thName.className = "small label";
        thName.innerHTML = "League Name"; //country
        th.appendChild(thName);
        table.appendChild(th);
        
        /*table content*/
        var arrayLength = this.data.length;
        for(var i = 0; i < arrayLength; i++) {
            var league = this.data[i];
            var tr = document.createElement("tr");
            var Place = document.createElement("td");
            Place.className = "small";
            Place.innerHTML = league.id.toString() + "&nbsp;";
            tr.appendChild(Place);
            var tdLeagueName = document.createElement("td");
            tdLeagueName.className = "small";
            tdLeagueName.innerHTML = league.caption.toString();
            tr.appendChild(tdLeagueName);
            table.appendChild(tr);
        }
        
        wrapper.appendChild(table);
        wrapper.className = "small dimmed";
    }else{
        //NO ERROR - LEAGUE TABLE FOUND
        var reqTimeMin = parseFloat(this.respheader.headers["x-requestcounter-reset"])/60;
        var reqCount = parseFloat(this.respheader.headers["x-requests-available"]);
        if (this.config.debug){
            wrapper.innerHTML += "Requests Left: " + reqCount.toString();
            wrapper.innerHTML += "<br>Counter Reset in " + (Math.round(reqTimeMin/60)).toString() + "h";
        }
        
        if (reqCount < 10) {
            //ONLY FEW REQUESTS LEFT!
            this.sendNotification("SHOW_ALERT", { timer: 5000, title: "FOOTBALL", message: "You have only "+reqCount.toString()+" updates left."});
        }else if (reqCount * this.config.updateInterval < reqTimeMin) {
            //IF UPDATED AT THIS FREQUENCY, THEN WILL RUN OUT OF REQUESTS PERMITTED
            this.sendNotification("SHOW_ALERT", { timer: 12000, title: "FOOTBALL", message: "At the current update Interval, will run out of permitted requests in " + (Math.round(reqCount * this.config.updateInterval / 60)).toString() + " hours." + " I suggest you set the updateInterval to " + (Math.ceil(reqTimeMin / reqCount)).toString() + " instead of " + (this.config.updateInterval).toString() + "."});
        }
        
        var table = document.createElement("table");
        var Nrs = 0; //number of countries
        var Ninterest = this.config.interest.length; //number of countries of interest
        var countryArray = []; //array of all alternatives for later sorting
        
        var th = document.createElement("tr");
        th.className = "small bright";
        
        var thPlace = document.createElement("td");
        thPlace.className = "small header";
        if(this.config.lblAsText){
            //thPlace.innerHTML = this.translate("POS")+ "&nbsp;"; //position
            thPlace.innerHTML = " "; //team name 
        }else{
            var iPlace = document.createElement("i");
            iPlace.className = "fa fa-hashtag";
            thPlace.appendChild(iPlace);
        }
        th.appendChild(thPlace);
            
        var thName = document.createElement("td");
        thName.className = "small header";
        if(this.config.lblAsText){
            //thName.innerHTML = this.translate("TEAM"); //team name 
            thName.innerHTML = " "; //team name 
        }else{
            var iName = document.createElement("i");
            iName.className = "fa fa-group"; //fa-group fa-futbol-o
            thName.appendChild(iName);
        } 
        th.appendChild(thName);
        
        var thPoints = document.createElement("td");
        thPoints.className = "small header";
        if(this.config.lblAsText){
            thPoints.innerHTML = this.translate("PNTS"); //points 
        }else{
            var iPoints = document.createElement("i");
            iPoints.className = "fa fa-signal"; //fa-sort-amount-desc fa-signal
            thPoints.appendChild(iPoints);
        } 
        th.appendChild(thPoints);
        
        var thGoals = document.createElement("td");
        thGoals.className = "small header";
        if(this.config.lblAsText){
            thGoals.innerHTML = "&nbsp;"+this.translate("GOALS"); //goals : goalsAgainst
        }else{
            var iGoals = document.createElement("i");
            iGoals.className = "fa fa-futbol-o"; //fa-futbol-o
            thGoals.appendChild(iGoals);
        }
        th.appendChild(thGoals);
        
        /*var thGoalDif = document.createElement("td");
        thGoalDif.className = "small label";
        thGoalDif.innerHTML = " "; //goals
        th.appendChild(thGoalDif);*/
        
        
        table.appendChild(th);
        
        /*************************************************
         * expecting data to be an array of countries, 
         * each country being a structure containing: 
         *  - country_name (the english common name of the country) 
         *  - place        (the ranking of the country)
         *  - id           (the country name in lower case without spaces)
         *  - gold_count   (the number of gold medals achieved)
         *  - silver_count (the number of silver medals achieved)
         *  - bronze_count (the number of bronze medals achieved)
         *  - total_count  (the total number of medals)
         ************************************************/
        
        /*sort the different teams*/
        /*
        if(this.config.sorting == "goals"){
            countryArray.sort(function(a, b) {
                return parseFloat(b.goals) - parseFloat(a.goals);
            });
        }else{
            countryArray.sort(function(a, b) {
                return parseFloat(a.position) - parseFloat(b.position);
            });
        }
        */
        
        
        var standings = this.data.standing;
        
        if (this.config.debug){
          this.sendNotification("SHOW_ALERT", { timer: 10000, title: "FOOTBALL", message: "ALL FINE" });
        }
        
        //if(standings.constructor === Array){
        if(Array.isArray(standings)){
        
        var arrayLength = standings.length;
        
        if (this.config.debug){
          this.sendNotification("SHOW_ALERT", { timer: 3000, title: "FOOTBALL", message: "arrayLength = " + arrayLength.toString()});
        }
        
        var teamsI = [];  //teams of interest (position)
        for(var i = 0; i < arrayLength; i++) {
            var team = standings[i];
            if (this.config.interest.indexOf(team.teamName) > -1){
                teamsI.push(team.position);
            }
        }
        var teamsX = [];  //teams to display
        var teamsXH = {}; //highlightlevel of teamX
        var addtype = 0.25;
        var tempcntr = 0;
        var temppos = 0;
        //var tempcntrB = 0;
        for(var i = 0; i < this.config.maximumEntries; i++) {
            if (addtype >= arrayLength){ //should be arrayLength/2
                //maxEntries too big
                i = this.config.maximumEntries;
            }else if (addtype == Math.floor(addtype)){
                temppos = teamsI[tempcntr]-Math.floor(addtype);
                if (teamsX.indexOf(temppos) < 0 && temppos >= 1 && temppos <= arrayLength){
                  teamsX.push(temppos);
                  teamsXH[temppos] = Math.floor(addtype);
                }else{
                  i -= 1;
                }
                tempcntr += 1;
                if (tempcntr >= teamsI.length){
                    tempcntr = 0;
                    addtype += 0.25;
                }
            }else if (addtype-0.25 == Math.floor(addtype)){
                temppos = teamsI[tempcntr]+Math.floor(addtype);
                if (teamsX.indexOf(temppos) < 0 && temppos >= 1 && temppos <= arrayLength){
                  teamsX.push(temppos);
                  teamsXH[temppos] = Math.floor(addtype);
                }else{
                  i -= 1;
                }
                tempcntr += 1;
                if (tempcntr >= teamsI.length){
                    tempcntr = 0;
                    addtype += 0.25;
                }
            }else if (addtype-0.5 == Math.floor(addtype)){
                temppos = 1+Math.floor(addtype);
                if (teamsX.indexOf(temppos) < 0 && temppos >= 1 && temppos <= arrayLength){
                  teamsX.push(temppos);
                  teamsXH[temppos] = Math.floor(addtype);
                }else{
                  i -= 1;
                }
                addtype += 0.25;
            }else{
                temppos = arrayLength-Math.floor(addtype)
                if (teamsX.indexOf(temppos) < 0 && temppos >= 1 && temppos <= arrayLength){
                  teamsX.push(temppos);
                  teamsXH[temppos] = Math.floor(addtype);
                }else{
                  i -= 1;
                }
                addtype = Math.floor(addtype) + 1;
            }
        }
        if (this.config.debug){
            wrapper.innerHTML += "<br>team pos: " + JSON.stringify(teamsX);
        }
        for(var i = 0; i < arrayLength; i++) {
            var country = standings[i];
            
            /*currently the entries are expected to be in order of country ranking.
            maximumEntries countries are selected, where all the countries of interest have to be definitely part of this.
            If there are more countries of interest than maximumEntries, then only the best countries are selected
            this model has a flaw in case one sorts by total medal count, as the sorting is done after the slicing*/
            //if(Nrs < this.config.maximumEntries - Ninterest || this.config.interest.indexOf(country.teamName) > -1){
            if(teamsX.indexOf(country.position) > -1){
            if (this.config.debug){
              this.sendNotification("SHOW_ALERT", { timer: 10000, title: "FOOTBALL", message: "team = " + Object.keys(country)});
            }
            
            var tr = document.createElement("tr");
            tr.className = "small";
            
            var Place = document.createElement("td");
            Place.className = "small number";
            Place.innerHTML = country.position.toString() + "&nbsp;";
            tr.appendChild(Place);
            
            var CountryName = document.createElement("td");
            CountryName.className = "small bright text";
            if(this.config.showCrests){
                var imgC = document.createElement("img");
                if(this.config.showColor){
                    imgC.className = "crest";
                }else{
                    imgC.className = "crest bw";
                }
                imgC.src = country.crestURI;
                //imgC.alt = country.teamName;
                CountryName.appendChild(imgC);
            }
            if(this.config.maxNameLength >= 0){
                var lblC = document.createElement("text");
                //var transcode = country.country_name.ToUpperCase();
                //transcode = transcode.replace(" ","_");
                if(this.config.maxNameLength == 0){
                  lblC.innerHTML = "&nbsp;" + country.teamName;
                }else{
                  lblC.innerHTML = "&nbsp;" + this.shorten(country.teamName,this.config.maxNameLength);
                }
                CountryName.appendChild(lblC);
            }
            tr.appendChild(CountryName);
            
            var Gold = document.createElement("td");
            Gold.className = "small number";
            Gold.innerHTML = country.points.toString();
            tr.appendChild(Gold);
            
            var Silver = document.createElement("td");
            Silver.className = "small number";
            Silver.innerHTML = country.goals.toString() + ":" + country.goalsAgainst.toString();
            tr.appendChild(Silver);
            
            // // var Bronze = document.createElement("td");
            // // Bronze.className = "small";
            // // Bronze.innerHTML = country.goalDifference;
            // // tr.appendChild(Bronze);
            
            countryArray.push({"position":country.position.toString(),"goals":country.goals.toString(),"html":tr});
            Nrs += 1;
            if (this.config.interest.indexOf(country.teamName) > -1){
                Ninterest -= 1;
            }
            
            }
        }
        
        /*sort the different teams*/
        if(this.config.sorting == "goals"){
            countryArray.sort(function(a, b) {
                return parseFloat(b.goals) - parseFloat(a.goals);
            });
        }else{
            countryArray.sort(function(a, b) {
                return parseFloat(a.position) - parseFloat(b.position);
            });
        }
        /*only show the first few options as specified by "maximumEntries"*/
        countryArray = countryArray.slice(0, this.config.maximumEntries);
        
        /*create fade effect and append list items to the list*/
        //var e = 0;
        Nrs = countryArray.length;
        var HKmax = Math.floor(addtype)+1; //Math.max(teamsXH);
        for(var dataKey in countryArray) {
            var countryData = countryArray[dataKey];
            var countryHtml = countryData.html;
            // Create fade effect. 
            if (this.config.fade) { // && this.config.fadePoint < 1) { 
                /*if (this.config.fadePoint < 0) { 
                    this.config.fadePoint = 0; 
                } */
                //var startingPoint = Nrs * this.config.fadePoint; 
                //var steps = Nrs - startingPoint; 
                //if (e >= startingPoint) { 
                if (HKmax > 0) { 
                    //var currentStep = e - startingPoint; 
                    countryHtml.style.opacity = 1 - (1 / HKmax * teamsXH[parseFloat(countryData.position)]);
                }
            }
            table.appendChild(countryHtml);
            //e += 1;
        }
        wrapper.appendChild(table);
        
        //var respstr = JSON.stringify(this.respheader);
        //var idA = respstr.indexOf('X-RequestCounter-Reset');
        //wrapper.innerHTML = JSON.stringify(Object.keys(this.respheader));
        //wrapper.innerHTML = JSON.stringify(this.respheader.headers);
        
        }else{
          //THIS LEAGUE IS A CHAMPIONSHIP
          wrapper.innerHTML = "ERROR: " + "The selected league id seems to link to a championship instead of a league. Currently only classic league tables can be displayed.";
          wrapper.className = "small dimmed error";
        }
    }
    return wrapper;
  },
  shorten: function(string, maxLength) { 
    /*shorten
     *shortens a string to (roughly) the number of characters specified*/
    if (string.length > maxLength) { 
        var parts = string.split(" ");
        if (parts.length == 1){
          return string.slice(0,maxLength) + "&hellip;";
        }else{
          var ans = "";
          var plen = Math.floor(maxLength/parts.length);
          for(var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.length > plen){
              ans += part.slice(0,plen) + ". ";
            }else{
              ans += part + " ";
            }
          }
          return ans;
        }
    }
    return string; 
  }

});

