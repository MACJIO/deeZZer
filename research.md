# Deezer research
App version 6.2.2.80 (Android)

## API methods
### mobile_auth GET HTTP
BASE_URL
api.deezer.com/1.0/gateway.php

Query params
* [network](#network)
* [api_key](#API-key)
* version - deezer app version
* lang - device lang like 'us'
* buildId - 'android_v6' always
* screenWidth
* screenHeight
* output - 3 always
* [uniq_id](#uniq_id)
* method - 'mobile_auth'

Description: returns TOKEN needed for auth_token generation

### api_checkToken GET HTTP
BASE_URL
api.deezer.com/1.0/gateway.php

Query params
* [api_key](#API-key)
* [auth_token](#auth_token)
* output - 3 always
* method - 'api_checkToken'

Description: initializes the session and returns session id.

### trial_enable POST HTTPS
BASE_URL
api.deezer.com/1.0/gateway.php

Query params
* [api_key](#API-key)
* [auth_token](#auth_token)
* method - 'trial_enable'
* output - 3 always
* input - 3 always
* [network](#network)
* [mobile_tracking](#mobile_tracking)

Data(JSON)
```(json)
{
    "ORIGIN": ""
}
```

Description: enables 15 days free trial.

### log.listen POST HTTPS
BASE_URL
api.deezer.com/1.0/gateway.php

Query params
* [api_key](#API-key)
* [sid](#sid)
* method - 'log.listen'
* output - 3 always
* input - 3 always
* [network](#network)
* [mobile_tracking](#mobile_tracking)

Data(JSON)
* next_media
    * media
        * id media deezer id
        * type media deezer type
* params
    * ctxt - page context like album wallpaper
        * c - deezer media id
        * id - deezer media id
        * t - deezer media type
* dev
    * t - 30 | 31
    * v - `Build.MANUFACTURER + '_' + Build.MODEL + '_' + Build.VERSION.RELEASE + '_' + app_version`
* device - device stats
    * cpu_count [Optional]
    * cpu_max_frequency [Optional]
    * ram [Optional]
* is_shuffle - 0 | 1
* l_30sec - 0 always
* lt - listen time in seconds
* media
    * [format](#media_format) 
    * id - media deezer id
    * type - media type
* network
    * subtype - wifi
    * type - LAN
* repeat_type - 'repeat_one' | 'repeat_all' [Optional]
* stat
    * conn - LAN
    * [media_format](#media_format)
    * pause - 0 | 1
    * player_version - often jukebox_exo_player_2
    * seek
    * sync - 0 | 1
* ts_listen - current timestamp in ms
* type - 0 | 1, for song listen use 0
* session_id - `java.util.UUID.getRandom().toString()`
* stream_id - `java.util.UUID.getRandom().toString()`


## Generated values
### network
Algorithm
1. Build string ```mcc + '+++' + mnc + '+++' + timestamp_ms```
2. Encrypt with aec-128-ecb, key `a8u5.26iHgcv,OIu`
3. Encode to hex

### sid
Returns from [api_checkToken]() method.

### uniq_id
Algorithm  
Build string:  
1. If can get the android id, build string 'ax' + android_id(64-bit number as hex string)
2. If can't get the android id, build string 'axdee3e5' + Build.SERIAL
3. Get md5 hash from string

### mobile_tracking
base64 encoded json
```json
{
  "oursecret": "deezer011013sc",
  "androidId": "androidId",
  "macAddress": "02:00:00:00:00:00",
  "device_type": "android",
  "app_id": "deezer.android.app"
}
```

### auth_token
Algorithm
1. Get TOKEN from mobile_auth method response
2. Encrypt with aes-128-ecb TOKEN.substr(0, 64), key TOKEN.substr(64, 80)
3. Encode to hex 

## Static values
### API Key
Android: `4VCYIJUCDLOUELGD1V8WBVYBNVDYOXEWSLLZDONGBBDFVXTZJRXPR29JRLQFO6ZE`  
IOS: `ZAIVAHCEISOHWAICUQUEXAEPICENGUAFAEZAIPHAELEEVAHPHUCUFONGUAPASUAY`

### media_format
0 'MP3_MISC'  
1 'MP3_128'  
3 'MP3_320'  
5 'MP3_256'  
6 'AAC_64'  
7 'MP3_192'  
8 'AAC_96'  
9 'FLAC'  
10 'MP3_64'  
11 'MP3_32'  
13 'MP4_RA1'  
14 'MP4_RA2'  
15 'MP4_RA3'  
default 'UNKNOWN'  
