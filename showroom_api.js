
var showroomAPICode = '(' + function() {

    document.showroom_api = {};
    
    const fetch_retry = async (url, options = null, n = 10) => {
        try {
            return await fetch(url, options).then(_response=>{
                if (_response.status === 500) {
                    console.error(_response);
                }
                return _response;
            });
        } catch(err) {
            if (n === 1) {
                console.error(err);
            }
            return await fetch_retry(url, options, n - 1);
        }
    };

    document.showroom_api.getCurrentUser = async (_roomId) => {
        try {
            const res = await fetch_retry(
            "https://www.showroom-live.com/api/live/current_user?room_id="+_roomId, {
                method: "GET"
            }, 10
            );
            const json = await res.json();
            return json;
        } catch (error) {
            console.error(error);
        }
    };

    document.showroom_api.getLives = async () => {
        try {
            const res = await fetch_retry(
            "https://www.showroom-live.com/api/live/onlives", {
                method: "GET"
            }, 10
            );
            const json = await res.json();
            return json;
        } catch (error) {
            console.error(error);
        }
    };

    document.showroom_api.getLiveInfo = async (_roomId) => {
        try {
            const res = await fetch_retry(
            "https://www.showroom-live.com/api/live/live_info?room_id="+_roomId, {
                method: "GET"
            }, 10
            );
            const json = await res.json();
            return json;
        } catch (error) {
            console.error(error);
        }
    };

    document.showroom_api.getProfile = async (_roomId) => {
        try {
            const res = await fetch_retry(
            "https://www.showroom-live.com/api/room/profile?room_id=" + _roomId, {
                method: "GET"
            }, 10
            );
            const json = await res.json();
            return json;
        } catch (error) {
            console.error(error);
        }
    };

    document.showroom_api.postComment = async (_live_id, _comment, _is_delay, _csrf_token) => {
        try {
            var formData = new FormData();
            formData.append("live_id", _live_id);
            formData.append("comment", _comment);
            formData.append("is_delay", _is_delay);
            formData.append("csrf_token", _csrf_token);

            const data = new URLSearchParams();
            for (const pair of formData) {
                data.append(pair[0], pair[1]);
            }

            const res = await fetch_retry(
            "https://www.showroom-live.com/api/live/post_live_comment", {
                method: "POST",
                body: data
            }
            );
            const json = await res.json();
            return json;
        } catch (error) {
            console.error(error);
        }
    };

    document.showroom_api.sendFreeGift = async (_gift_id, _live_id, _num, _csrf_token, _isRemovable = true) => {
        try {
            var formData = new FormData();
            formData.append("gift_id", _gift_id);
            formData.append("live_id", _live_id);
            formData.append("num", _num);
            formData.append("csrf_token", _csrf_token);
            formData.append("isRemovable", _isRemovable);

            const data = new URLSearchParams();
            for (const pair of formData) {
                data.append(pair[0], pair[1]);
            }

            const res = await fetch_retry(
            "https://www.showroom-live.com/api/live/gifting_free", {
                method: "POST",
                body: data
            }
            );
            const json = await res.json();
            return json;
        } catch (error) {
            console.error(error);
        }
    };

    console.log("Showroom API has been initialized.");

} + ')();';
var showroomAPIScript = document.createElement('script');
showroomAPIScript.textContent = showroomAPICode;
(document.head||document.documentElement).appendChild(showroomAPIScript);
showroomAPIScript.remove();

