"use strict";

(function () {

    $(function () {
        let arrCoins = [];
        let localStorageCoinsArr = [];
        let maxCoins = 5;

        //scrolldown button
        $('a').on('click', function (e) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: $($(this).attr('href')).offset().top }, 3000, 'linear');
        });

        $("#tabs").tabs();

        // call a function to bring all coins
        getAllCoins();

        // function for bring all coins
        async function getAllCoins() {
            try {

                let coins = await fetchData("https://api.coingecko.com/api/v3/coins/list", "#coins", 1);

                //create dynamic div for each coin
                createDivForCoin(coins);

                // get coin-ID by clicking on "more info" button
                $(".moreInfoBtn").click(function () {

                    // condition that check if "more-info" is going to be openned (false) or closed (true)
                    if ($(this).attr("aria-expanded") == "false") {
                        let coinId = $(this).closest(".coinDIvLeftInner").find(".coinId")[0].innerHTML;
                        let moreInfoId = $(this).attr("data-target");

                        let flag = 0;
                        for (let i = 0; i < localStorageCoinsArr.length; i++) {

                            // condition that check if this is the first click on 'more info' button
                            if ((localStorageCoinsArr[i].id == moreInfoId)) {

                                //flag=1 means the 'more info' id already exist = not the first click
                                flag = 1;
                                let moreInfoTime = localStorageCoinsArr[i].time;

                                // condition if 2 min passed
                                if (is2MinutesPassed(moreInfoTime)) {
                                    console.log("2 min passed");

                                    // calling a new ajax if 2 min passed
                                    getCoinDetails(coinId, moreInfoId);
                                }
                                break;
                            }
                        }
                        //flag=0 means the 'more info' id doesn't exist = this is the first click on 'more info' button
                        if (flag == 0) {

                            // calling a new ajax
                            getCoinDetails(coinId, moreInfoId);
                        }
                    }

                });

                // Get symbol coin for real time report
                $("#coins input[type='checkbox']").click(function () {

                    // condition if the toggle  trun on (=checked) or turn off
                    if ($(this).is(":checked")) {
                        let coinId = $(this).closest(".coinDiv").find(".symbol")[0].innerHTML;
                        if (arrCoins.length < maxCoins) {
                            arrCoins.push(coinId);
                        }
                        else {
                            this.checked = false;
                            // open here a modal
                            let currentTuggle = $(this)[0];

                            $("#myBtnModal").click();
                            $(".modal-title").html("Coins that have been selceted by you")
                            $(".modal-body").empty();
                            $("#saveChangeBtn").show();
                            $(".modal-body").html("<p>You can select only 5 coins. If you want to select <span class='coin6'>" + coinId + "</span>  please remove one or more coins from the following coins:</p>");
                            for (let i = 0; i < arrCoins.length; i++) {
                                let toggle = '<label class="switch"><input type="checkbox" checked><span class="slider round"></span></label>'
                                let symbol = "<div class='symbol'>" + arrCoins[i] + "</div>";
                                $(".modal-body").append("<div class='coinsInModal col-4'>" + symbol + "<br>" + toggle + "</div>");
                            }

                            //save button in modal
                            $("#saveChangeBtn").click(function () {

                                arrCoins = [];
                                
                                $(".coinsInModal input[type='checkbox']:checked").filter(function () {
                                    let symbolIcon = $(this).closest(".coinsInModal").find(".symbol")[0].innerHTML;
                                    arrCoins.push(symbolIcon);
                                });

                                // add the new coin after removing one of the coins by modal
                                if (arrCoins.length < maxCoins) {
                                    currentTuggle.checked = true;
                                    let currentSymbol = $(currentTuggle).closest(".coinDiv").find(".symbol")[0].innerHTML;
                                    arrCoins.push(currentSymbol);
                                }

                                // update the previous selected coins by the new selceted coins from the modal
                                $("#coins input[type='checkbox']:checked").filter(function () {
                                    let symbolIconDiv = $(this).closest(".coinDiv").find(".symbol")[0].innerHTML;
                                    let flag = 0;
                                    for (let i = 0; i < arrCoins.length; i++) {
                                        if (arrCoins[i] == symbolIconDiv) {
                                            flag = 1;
                                            break;
                                        }
                                    }

                                    if (flag == 0) {
                                        $(this).attr('checked', false);
                                    }
                                });
                            })
                        }
                    }
                    else {
                        // the toggle turned off and needs to remove this coin from the arrCoins 
                        let coinId = $(this).closest(".coinDiv").find(".symbol")[0].innerHTML;
                        let index = arrCoins.indexOf(coinId);
                        if (index > -1) {
                            arrCoins.splice(index, 1);
                        }
                    }
                });
            }
            catch (error) {
                alert("Error: " + error.statusText);
            }
        }

        // execute the real time report based on list of 5 coins' symbol
        $("a[href='#reports']").click(function () {
            //message when no coin was selected
            if (arrCoins.length < 1) {

                let that = $("a[href='#coins']");
                $(that).click();
                let noCoins = "Please select at least 1 coin";
                modalError(noCoins);
            }
            else {
                //function that call to API for the chart
                getRealTimePriceOfCoin(arrCoins);
            }
        });

        // modal that show error or missing data
        function modalError(errorText) {
            $(".modal-body").empty();
            $(".modal-title").empty();
            $("#myBtnModal").click();
            $(".modal-title").html(errorText)
            $("#saveChangeBtn").hide();
        }

         //function that call to API for the chart
        async function getRealTimePriceOfCoin(arrCoins) {
            try {
                $("#reports").find().empty();
                let coinsForReport = await fetchData("https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + arrCoins + "&tsyms=USD", "#reports", 2000);

                // modal message when there is no data for the selected coin
                if (coinsForReport.Response === "Error") {
                    let that = $("a[href='#coins']");
                    $(that).click();
                    let noData = coinsForReport.Message;
                    modalError(noData);
                }

                else {
                    //call the function to creat the chart
                    chartCoinsPrices(coinsForReport, arrCoins);
                }


            }
            catch (error) {
                alert(error.statusText);
            }
        }

        // execute by clicking on "more info" button
        async function getCoinDetails(coinId, moreInfoId) {
            try {
                let coinDetails = await fetchData("https://api.coingecko.com/api/v3/coins/" + coinId);

                let thumb = coinDetails.image.thumb;
                let usd = parseFloat(coinDetails.market_data.current_price.usd).toFixed(4);
                let eur = parseFloat(coinDetails.market_data.current_price.eur).toFixed(4);
                let ils = parseFloat(coinDetails.market_data.current_price.ils).toFixed(4);

                createMoreInfoDetails(thumb, usd, eur, ils, moreInfoId);

            }
            catch (error) {
                alert(error.statusText);
            }
        }

        //the main function of ajax
        async function fetchData(url, idTab, setTime) {
            $("#loader").css("display", "block");
            $(idTab).css("display", "none");

            let myPromise = new Promise((resolve, reject) => {
                $.ajax({
                    method: "GET",
                    url: url,
                    success: function (response) {
                        resolve(response);

                        // condition of display the current tab only if the response !== "error" 
                        if (response.Response !== "Error") {
                            setTimeout(() => {
                                $(idTab).css("display", "");
                                $("#loader").css("display", "none");
                            }, setTime);
                        }
                        else {
                            $("#loader").css("display", "none");
                        }
                    },
                    error: function (error) {
                        $("#loader").css("display", "none");
                        reject(error);
                    }
                });
            });
            return myPromise;
        }

        //create the inner data in "more info" collapse
        function createMoreInfoDetails(thumb, usd, eur, ils, moreInfoId) {
            let info = "<img class='coinImage' src=" + thumb + "></img><div class='usd'>" + usd + " $</div><div class='eur'>" + eur + " &euro;</div><div class='ils'>" + ils + " ₪</div>"

            let today = new Date();
            let moreInfoTime = today.getTime();
            let flag = 0;

            for (let i = 0; i < localStorageCoinsArr.length; i++) {
                if (localStorageCoinsArr[i].id == moreInfoId) {
                    localStorageCoinsArr[i].thumb = thumb;
                    localStorageCoinsArr[i].usd = usd;
                    localStorageCoinsArr[i].eur = eur;
                    localStorageCoinsArr[i].ils = ils;
                    localStorageCoinsArr[i].time = moreInfoTime;
                    
                    flag = 1;
                    break;
                }
            }
            // push in array when it is a new data that wasn't stored before
            if (flag == 0) {
                localStorageCoinsArr.push({
                    id: moreInfoId,
                    thumb: thumb,
                    usd: usd,
                    eur: eur,
                    ils: ils,
                    time: moreInfoTime
                });
            }

            $(moreInfoId).find(".cardMoreInfo").html(info);
            //update the local storage
            localStorage.setItem("moreInfoCoins", JSON.stringify(localStorageCoinsArr));
        }

        // function that validate if 2 min passed. true = above 2 min, false = below 2 min
        function is2MinutesPassed(moreInfoTime) {

            let today = new Date();
            let currentTime = today.getTime()
            return ((currentTime - moreInfoTime) >= 120000) ? true : false;
        }

        // make div for each coin in the home page
        function createDivForCoin(coins) {

            for (let i = 0; i < 100; i++) {
                let id = "<div class='coinId'>" + coins[i].id + "</div>";
                let toggle = '<div><label class="switch"><input type="checkbox"><span class="slider round"></span></label></div>'
                let symbol = "<div class='symbol'>" + coins[i].symbol.toUpperCase() + "</div>";
                let moreInfo = '<p><button class="btn btn-primary moreInfoBtn" type="button" data-toggle="collapse" data-target="#id' + i + '" aria-expanded="false" aria-controls="collapseExample">More info</button></p><div class="collapse" id="id' + i + '"><div class="card card-body cardMoreInfo"></div></div>'
                let coinDIvLeftInner = "<div class='coinDIvLeftInner'>" + symbol + id + moreInfo + "</div>";
                $("#coins").append("<div class='coinDiv'>" + coinDIvLeftInner + toggle + "</div>");
            }

            // click on "search" open the "coins" tag
            $("#search").click(function () {
                $("a[href='#coins']").click();
            });

            //quick search by keyup
            $("#search").on("keyup", function () {

                let value = $(this).val().toLowerCase();
                let items = $(".symbol");
                //first, hide all:
                $(".coinDiv").hide();

                if (value !== "") {
                    //show only those matching user input:
                    items.filter(function () {
                        return $(this).text().toLowerCase() == value;
                    }).closest(".coinDiv").show();
                    $("#coins").css("height", "auto");
                }
                else {
                    items.closest(".coinDiv").show();
                    $("#coins").css("height", "90%");
                }
            });

            //filter only the selected coins
            $("#selectedCoins").on("click", function () {
            
                $("a[href='#coins']").click();
                let defualtText = "Show selected coins";

                if ($(this).text() == defualtText) {
                    if (!$("#coins input[type='checkbox']:checked").filter().prevObject.length){
                        let noCoins = "Please select at least 1 coin";
                        modalError(noCoins);
                    }
                    
                    else{
                        $(".coinDiv").hide();
                        $(this).text("Show all coins");
                        $("#coins").css("height", "auto");
                        $("#coins input[type='checkbox']:checked").filter(function(){
                            $(this).closest(".coinDiv").show();
                        });
                    }     
                }
                else {
                    $(this).text(defualtText);
                    $(".coinDiv").show();
                    $("#coins").css("height", "90%");
                }
            });


        }
        // Dynamic / Live Multi Series Chart
        function chartCoinsPrices(coinsForReport, arrCoins) {

            let dataPoints1 = [];
            let dataPoints2 = [];
            let dataPoints3 = [];
            let dataPoints4 = [];
            let dataPoints5 = [];

            let options = {
                title: {
                    text: "Coins values converted to $ USD"
                },
                axisX: {
                    title: "Current time - update every 2 secs"
                },
                axisY: {
                    suffix: "$",
                    includeZero: false
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "top",
                    fontSize: 22,
                    fontColor: "dimGrey",
                    itemclick: toggleDataSeries
                },
                data: [{
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.0000$",
                    xValueFormatString: "hh:mm:ss TT",
                    dataPoints: dataPoints1
                },
                {
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.0000$",
                    xValueFormatString: "hh:mm:ss TT",
                    dataPoints: dataPoints2
                }, {
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.0000$",
                    xValueFormatString: "hh:mm:ss TT",
                    dataPoints: dataPoints3
                },
                {
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.0000$",
                    xValueFormatString: "hh:mm:ss TT",
                    dataPoints: dataPoints4
                },
                {
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.0000$",
                    xValueFormatString: "hh:mm:ss TT",
                    dataPoints: dataPoints5
                }]
            };

            //get the symbol name of each coin and put in on array
            let coinsForReportArr = Object.keys(coinsForReport);
            // if there is no data in specific coin find it and add "-No Data"
            if (coinsForReportArr.length != arrCoins.length) {
                for (let i = 0; i < arrCoins.length; i++) {
                    let flag = 0;
                    for (let j = 0; j < coinsForReportArr.length; j++) {
                        if (arrCoins[i] === coinsForReportArr[j]) {
                            flag = 1;
                            break;
                        }
                    }
                    if (flag == 0) {
                        let missingCoin = arrCoins[i] + "-No Data";
                        coinsForReportArr.push(missingCoin);
                    }
                }
            }

            //add the name of each coin from the coinsForReportArr array
            for (let i = 0; i < coinsForReportArr.length; i++) {
                options.data[i].showInLegend = true;
                options.data[i].name = coinsForReportArr[i];
            }
    
            let chart = $("#chartContainer").CanvasJSChart(options);

            // function to make the coin visible or invisbile in the chart
            function toggleDataSeries(e) {

                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;

                }
                else {
                    e.dataSeries.visible = true;

                }
                e.chart.render();
            }

            let updateInterval = 2000;
            // initial value
            let yValue = []
            for (let key in coinsForReport) {

                yValue.push(coinsForReport[key].USD);
            }


            let time = new Date();

            function updateChart(arrCoins) {

                time.setTime(time.getTime() + updateInterval);

                $.ajax({
                    method: "GET",
                    url: "https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + arrCoins + "&tsyms=USD",
                    success: function (response) {
                        if (response.Response === "Error") {
                            clearInterval(updatingChart);
                            options.title.text = "No data accepted! " + response.Message;

                        }
                        let yValue = []
                        for (let key in response) {

                            yValue.push(response[key].USD);
                        }



                        // pushing the new values
                        dataPoints1.push({
                            x: time.getTime(),
                            y: yValue[0]
                        });
                        dataPoints2.push({
                            x: time.getTime(),
                            y: yValue[1]
                        });
                        dataPoints3.push({
                            x: time.getTime(),
                            y: yValue[2]
                        });
                        dataPoints4.push({
                            x: time.getTime(),
                            y: yValue[3]
                        });
                        dataPoints5.push({
                            x: time.getTime(),
                            y: yValue[4]
                        });

                        $("#chartContainer").CanvasJSChart().render();

                        $(".canvasjs-chart-credit").hide();
                    },
                    error: function (error) {
                        alert(error.statusText);
                    }
                });
            }


            let updatingChart = setInterval(function () { updateChart(arrCoins) }, updateInterval);
           
            //stop and clear the chart once click on other tabs
            $("a[href='#about']").click(() => {
                clearInterval(updatingChart);
                $("#reports").find().empty();

            });

            $("a[href='#coins']").click(() => {
                clearInterval(updatingChart);
                $("#reports").find().empty();
                $("#chartContainer").empty();
            });
        }
    });
})();
