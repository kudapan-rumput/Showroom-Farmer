var showroomFarmerCode = '(' + function() {

    var comment_config = {};
    var roomInfo = null;
    var isFarming = false;
    var showroom_api = document.showroom_api;

    function checkFreeGifts() {
        let nextFreeGifts = window.localStorage.getItem("nextFreeGifts");
        if (nextFreeGifts) {
            nextFreeGifts = new Date(JSON.parse(nextFreeGifts));
        }
        else {
            nextFreeGifts = new Date();
        }

        let currentDate = new Date();
        if (currentDate >= nextFreeGifts && !isFarming) {
            uiElements.farmingButton.disabled = false;
            uiElements.farmingButton.classList.remove("is-disabled");
            console.log("Free gifts available to farm.");
        }
        else {
            uiElements.farmingButton.disabled = true;
            uiElements.farmingButton.classList.add("is-disabled");
        }

        setTimeout(function() {
            checkFreeGifts();
        }, 60000);
    }

    //#region REQUEST-LISTENER
    var oldOpen = XMLHttpRequest.prototype.open;

    var allAPIs = [];

    function onStateChange(event) {
        if (this.responseURL) {
            if (!allAPIs.includes(this.responseURL)) {
                allAPIs.push(this.responseURL);
            }

            if (this.responseURL.includes("api/live/live_info?")) {
                if (this.response) {
                    var responseJson = JSON.parse(this.response);
                    if(responseJson.live_id == 0 && isFarming) {
                        onFinishedRoomFarm();
                    }
                }
            }
            else if (this.responseURL.includes("/api/live/polling?") && isFarming) {
                if (onFinishedRoomFarm == null) {
                    return;
                }
                if (this.response) {
                    var responseJson = JSON.parse(this.response);
                    var continueTraverse = true;
                    if (responseJson.toast) {
                        if (responseJson.toast.message) {
                            console.log(responseJson.toast.message);
                            if (responseJson.toast.message.includes("free viewing")) {
                                if (roomInfo.official_lv > 0) {
                                    console.log("Dapat Bintang! --> Ganti Room");
                                }
                                else {
                                    console.log("Dapat Kecambah! --> Ganti Room");
                                }
                            }
                            else if (responseJson.toast.message.includes("You can get free gifts after ")) {
                                if (roomInfo.official_lv > 0) {
                                    onFinishedRoomFarm = null;
                                    continueTraverse = false;
                                    var targetTime = responseJson.toast.message.replace("You can get free gifts after ", "");
                                    targetTime = targetTime.replace(".","").split(":");
                                    targetTime = [parseInt(targetTime[0]), parseInt(targetTime[1])];
                                    var targetDate = new Date();
                                    targetDate.setHours(targetTime[0]);
                                    targetDate.setMinutes(targetTime[1]);
                                    window.localStorage.setItem("nextFreeGifts", JSON.stringify(targetDate));
                                    console.log("Target Date: " + targetDate);
                                    endRoomTraversal();
                                    alert(responseJson.toast.message);
                                    window.location = "https://www.showroom-live.com/";
                                }
                            }
                        }
                    }
                    if (continueTraverse) {               
                        let onFinished = onFinishedRoomFarm;
                        onFinishedRoomFarm = null;
                        onFinished();
                    }
                }
            }
        }
    }

    XMLHttpRequest.prototype.open = function() {
        // when an XHR object is opened, add a listener for its readystatechange events
        this.addEventListener("readystatechange", onStateChange)

        // run the real `open`
        oldOpen.apply(this, arguments);
    }

    var oldSend = XMLHttpRequest.prototype.send; 

    XMLHttpRequest.prototype.send = function() {
        for (let i in arguments) {
            if (typeof arguments[i] !== 'string') {
                continue;
            }
            if (!arguments[i].includes("=init&")) {
                continue;
            }
            if (arguments[i].includes("live_id=") && arguments[i].includes("is_delay=") && arguments[i].includes("csrf_token=")) {
                let headers = arguments[i].split('&');
                for(let j in headers) {
                    if (headers[j].includes("live_id")) {
                        comment_config.live_id = headers[j].replace("live_id=", "");
                    }                
                    else if (headers[j].includes("is_delay")) {
                        comment_config.is_delay = headers[j].replace("is_delay=", "");
                    }
                    else if (headers[j].includes("csrf_token=")) {
                        comment_config.csrf_token = headers[j].replace("csrf_token=", "");
                    }
                }
                console.log("Room add-on has been initialized.");
                alert("Initialization success.");
                XMLHttpRequest.prototype.send = oldSend;

                let input_element = document.getElementById("js-chat-input-comment");
                input_element.value = "";
                return;
            }
        }
        oldSend.apply(this, arguments);
    }
    //#endregion REQUEST-LISTENER

    //#region FARMER

    var onFinishedRoomFarm = null;

    function traverseRoom(_lives, _currentCategory, _currentLive) {
        onFinishedRoomFarm = ()=> {
            if (_currentLive < _lives.onlives[_currentCategory].lives.length-1) {
                openRoom(_lives, _currentCategory, _currentLive+1);
            }
            else {
                if (_currentCategory < _lives.onlives.length-1) {
                    openRoom(_lives, _currentCategory+1, 1);
                }
                else {
                    endRoomTraversal();
                }
            }
        };

    }

    function openRoom(_lives, _currentCategory, _currentLive, _newTab = false) {
        localStorage.setItem("currentCategory", _currentCategory);
        localStorage.setItem("currentLive", _currentLive);
        console.log(_lives.onlives[_currentCategory].genre_name + " - " + _lives.onlives[_currentCategory].lives[_currentLive].main_name);
        let link = "https://www.showroom-live.com/" + _lives.onlives[_currentCategory].lives[_currentLive].room_url_key;
        if (_newTab) {
            window.open(link, "_blank") || window.location.replace(link);
        }
        else {
            window.location = link;
        }
    }

    function endRoomTraversal() {
        localStorage.removeItem("showroomTraversing");
        localStorage.removeItem("showroomLives");
        localStorage.removeItem("currentCategory");
        localStorage.removeItem("currentLive");
    }

    function startFarming() {
        showroom_api.getLives().then(_lives=> {
            localStorage.setItem("showroomTraversing", true);
            localStorage.setItem("showroomLives", JSON.stringify(_lives));
            openRoom(_lives, 0, 0, false);            
        });
    }

    //#endregion FARMER

    //#region COMMENT
    function startAutoCount() {

        for (let i=0; i<=50; i++) {
            setTimeout(function(){ 
                showroom_api.postComment(
                    comment_config.live_id, 
                    i,
                    comment_config.is_delay,
                    comment_config.csrf_token
                ).then(_result=>{
                    console.log("comment sent: " + i + ", live id: " + comment_config.live_id);
                    uiElements.commentText.innerHTML = "&nbsp&nbsp" + i;
                });
            }, i*2000);
        }

        setTimeout(function(){
            uiElements.commentText.innerHTML = "";
        }, 51*2000);
    }
    //#endregion COMMENT
    
    //#region GIFT
    var starGiftIds = ["1", "1001", "1002", "1003", "2"];
    var kecambahGiftIds = ["1501", "1502", "1503", "1504", "1505"];

    function sendAllFreeGifts(_gifts, _giftIndex, _giftAmount) {
        showroom_api.sendFreeGift(_gifts[_giftIndex], comment_config.live_id, _giftAmount, comment_config.csrf_token)
        .then(_result=> {
            console.log("sent: " + _giftAmount + "x" + _result.gift_name + ", bonus: " + (_result.bonus_rate * _giftAmount) + ", remaining: " + _result.remaining_num);
            if (_result.gift_name) {
                uiElements.logText.innerHTML = "Sent: " + _giftAmount + " x " + _result.gift_name + ", Bonus: " + (_result.bonus_rate * _giftAmount) + ", Remaining: " + _result.remaining_num;
            }
            uiElements.contributionText.innerHTML = "Next Lv: " + _result.fan_level.contribution_point + " / " +  _result.fan_level.next_level_point;

            if (_result.remaining_num >= 10) {
                sendAllFreeGifts(_gifts, _giftIndex, 10);
            }
            else {
                if (_result.remaining_num > 0) {
                    sendAllFreeGifts(_gifts, _giftIndex, _result.remaining_num);
                }
                else if (_giftIndex < _gifts.length-1) {
                    sendAllFreeGifts(_gifts, _giftIndex+1, 10);
                }
            }
        })
        .catch(_error=>{
            if (_giftAmount == 1) {
                if (_giftIndex < _gifts.length-1) {
                    sendAllFreeGifts(_gifts, _giftIndex+1, 10);
                }
            }
            else {
                sendAllFreeGifts(_gifts, _giftIndex, _giftAmount-1);
            }
        });
    }

    document.sendKecambah = function(_index, _giftAmount) {
        showroom_api.sendFreeGift(kecambahGiftIds[_index], comment_config.live_id, _giftAmount, comment_config.csrf_token)
        .then(_result=> {
            console.log(_result);
        });
    }
    //#endregion GIFT

    //#region UI-ELEMENT
    var uiElements = {};

    function initRoomUIElements(_profile) {
        var commentWrapper = document.getElementById("js-room-comment-wrapper");

        var commentDiv = document.createElement("div");
        commentDiv.classList.add("comment-input-box");
        commentWrapper.append(commentDiv);

        if (commentWrapper != null) {
            var autoCountButton = document.createElement("button");
            autoCountButton.classList.add("comment-btn");
            autoCountButton.style.width = "150px";
            autoCountButton.innerHTML = "Auto Count";
        
            commentDiv.appendChild(autoCountButton);
        
            autoCountButton.addEventListener ("click", function() {
                if (comment_config.csrf_token === undefined) {
                    alert("Post 'init' comment first.");
                    return;
                }
                startAutoCount();
            });

            uiElements.autoCountButton = autoCountButton;

            var commentText = document.createElement("div");
            commentText.classList.add("gift-area");
            commentText.style.alignSelf = "center";
            commentText.style.fontSize = "12px";
            commentText.innerHTML = "";
            commentDiv.appendChild(commentText);

            uiElements.commentText = commentText;
        }
    
        var giftArea = document.getElementById("gift-area");
        if (giftArea != null) {

            var extensionForm = document.createElement("div");
            giftArea.appendChild(extensionForm);

            var extensionDiv = document.createElement("div");
            extensionDiv.classList.add("comment-input-box");
            extensionForm.append(extensionDiv);

            var freeGiftsButton = document.createElement("button");
            
            freeGiftsButton.classList.add("gift-btn-purchase-sg");
            freeGiftsButton.style.width = '150px';
            freeGiftsButton.style.height = '30px';
            freeGiftsButton.style.fontSize = '12px';
            freeGiftsButton.innerHTML = _profile.is_official? "Send All Stars" : "Send All Kecambah";
        
            extensionDiv.appendChild(freeGiftsButton);
        
            freeGiftsButton.addEventListener ("click", function() {
                if (comment_config.csrf_token === undefined) {
                    alert("Post 'init' comment first.");
                    return;
                }
                if (_profile.is_official) {
                    sendAllFreeGifts(starGiftIds, 0, 10);
                }
                else {
                    sendAllFreeGifts(kecambahGiftIds, 0, 10);
                }
            });
            uiElements.freeGiftsButton = freeGiftsButton;

            
            var farmingButton = document.createElement("button");
            
            farmingButton.classList.add("comment-btn");
            farmingButton.style.width = '102px';
            farmingButton.style.height = '30px';
            farmingButton.style.fontSize = '12px';
            farmingButton.innerHTML = "Auto Farm";
        
            extensionDiv.appendChild(farmingButton);
        
            farmingButton.addEventListener ("click", function() {
                uiElements.farmingButton.disabled = true;
                uiElements.farmingButton.classList.add("is-disabled");
                startFarming();
            });

            uiElements.farmingButton = farmingButton;
            checkFreeGifts();

            //#region MULTI-GIFT
            /*var multiGiftForm = document.createElement("div");
            giftArea.appendChild(multiGiftForm);

            var multiGiftDiv = document.createElement("div");
            multiGiftDiv.classList.add("comment-input-box");
            multiGiftForm.append(multiGiftDiv);

            var giftInput = document.createElement("input");
            giftInput.type = "number";
            giftInput.value = 0;
            giftInput.autocomplete = "off";
            giftInput.classList.add("comment-input-text");
            giftInput.onchange = _value => {
                console.log(_value);
            };
            multiGiftDiv.appendChild(giftInput);
            uiElements.giftInput = giftInput;

            var sendGiftsButton = document.createElement("button");
            sendGiftsButton.classList.add("comment-btn");
            sendGiftsButton.style.width = '100px';
            sendGiftsButton.innerHTML = "Send Gifts";
            multiGiftDiv.appendChild(sendGiftsButton);
            uiElements.sendGiftsButton = sendGiftsButton;*/
            //#endregion MULTI-GIFT

            var contributionText = document.createElement("div");
            contributionText.innerHTML = "";
            giftArea.appendChild(contributionText);

            var logText = document.createElement("div");
            logText.style.fontSize = "12px";
            logText.innerHTML = "-";
            giftArea.appendChild(logText);

            uiElements.contributionText = contributionText;
            uiElements.logText = logText;

            document.showroom_api.getCurrentUser(_profile.room_id).then(_user=>{
                contributionText.innerHTML = "Next Lv: " + _user.contribution_point + " / " +  _user.next_level_point;;
            });
        }
    }
    
    if (document.all["this-room-profile"]) {
        showroom_api.getProfile(document.all["this-room-profile"].search.replace("?room_id=", "")).then(_profile => {
            console.log("Room profile has been initialized.");
            initRoomUIElements(_profile);
        });
    }
    else {        
        var pcHeader = document.getElementById("hamburger").parentElement;
        var autoFarmButton = document.createElement("button");
        autoFarmButton.innerHTML = "Auto Farm";

        pcHeader.appendChild(autoFarmButton);

        autoFarmButton.addEventListener ("click", function() {
            autoFarmButton.disabled = true;
            startFarming();
        });
    }
    ////#endregion UI-ELEMENT


    if (localStorage.getItem("showroomTraversing")) {
        isFarming = true;
        var lives = JSON.parse(localStorage.getItem("showroomLives"));
        var currentCategory = parseInt(localStorage.getItem("currentCategory"));
        var currentLive = parseInt(localStorage.getItem("currentLive"));
        roomInfo = lives.onlives[currentCategory].lives[currentLive];
        traverseRoom(lives, currentCategory, currentLive);
        
        showroom_api.getLiveInfo(roomInfo.room_id).then(_liveInfo=>{
            if(_liveInfo.live_id == 0) {
                onFinishedRoomFarm();
            }
        });

        var headerUserInfo = document.getElementById("label-start-time").parentElement;
        
        var farmingStatusDiv = document.createElement("div");
        farmingStatusDiv.classList.add("label-room");
        farmingStatusDiv.style.display = "inline-block";
        farmingStatusDiv.style.fontSize = "20px";
        farmingStatusDiv.innerHTML = "Farming...";

        var preventChangeRoomButton = document.createElement("button");
        preventChangeRoomButton.innerHTML = "Prevent Changing Room";
        preventChangeRoomButton.style.display = "inline-block";
        preventChangeRoomButton.style.color = "black";
        preventChangeRoomButton.addEventListener('click', function(){
            isFarming = false;
            alert("This room is now excluded from farming activity and will not move into next room.");
            headerUserInfo.removeChild(farmingStatusDiv);
            headerUserInfo.removeChild(preventChangeRoomButton);
            farmingStatusDiv.remove();
            preventChangeRoomButton.remove();
            farmingStatusDiv = null;
            preventChangeRoomButton = null;
        });

        var stopFarmingButton = document.createElement("button");
        stopFarmingButton.innerHTML = "Stop Farming";
        stopFarmingButton.style.display = "inline-block";
        stopFarmingButton.style.color = "black";
        stopFarmingButton.addEventListener('click', function(){
            isFarming = false;
            if (farmingStatusDiv) {
                headerUserInfo.removeChild(farmingStatusDiv);
                headerUserInfo.removeChild(preventChangeRoomButton);
                farmingStatusDiv.remove();
                preventChangeRoomButton.remove();
            }
            headerUserInfo.removeChild(stopFarmingButton);
            stopFarmingButton.remove();
            endRoomTraversal();
            checkFreeGifts();
        });

        headerUserInfo.append(farmingStatusDiv);
        headerUserInfo.append(preventChangeRoomButton);
        headerUserInfo.append(stopFarmingButton);

    }

    console.log("Showroom Farmer v1.0 by kudapan_rumput has been initialized.");

} + ')();';
var showroomFarmerScript = document.createElement('script');
showroomFarmerScript.textContent = showroomFarmerCode;
(document.head||document.documentElement).appendChild(showroomFarmerScript);
showroomFarmerScript.remove();