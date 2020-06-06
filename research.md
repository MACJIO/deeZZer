# Deezer research
App version 6.2.2.80

### API methods
#### mobile_auth GET HTTP
BASE_URL
api.deezer.com/1.0/gateway.php

Query params
* [network](#network)
* [api_key](#API-key)
* version - deezer app version
* lang - device lang like 'us'
* buildId - android build id like 'android_v6'
* screenWidth
* screenHeight
* output - always 3
* [uniq_id](#uniq_id)
* method - 'mobile_auth'

Description: returns TOKEN needed for auth_token generation



### Generated values
#### network
Algorithm
1. Build string ```mcc + '+++' + mnc + '+++' + timestamp_ms```
2. Encrypt with aec-128-ecb, key `a8u5.26iHgcv,OIu`
3. Decode to hex

#### uniq_id
TODO

### Static values
#### API Key
Android: `4VCYIJUCDLOUELGD1V8WBVYBNVDYOXEWSLLZDONGBBDFVXTZJRXPR29JRLQFO6ZE`
IOS: `ZAIVAHCEISOHWAICUQUEXAEPICENGUAFAEZAIPHAELEEVAHPHUCUFONGUAPASUAY`

