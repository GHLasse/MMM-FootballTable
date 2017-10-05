[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://choosealicense.com/licenses/mit/)

# MMM-FootballTable Module
This module displays the league tables of football/soccer from football-data.org

## Usage 
You need to install the module for your MagicMirror.

### Installation
Navigate into your MagicMirror's modules folder:
```shellcd ~/MagicMirror/modules```
Clone this repository:
```shellgit clone https://github.com/GHLasse/MMM-FootballTable```
Configure the module in your config.js file.

### Configuration
Add module configuration to config.js.
```js
{ 
    module: 'MMM-FootballTable',   
    config: {    
        leagueid: THELEAGUEIDOFINTEREST,
    }
}
```
|Option|Description|
|---|---|
|`leagueid`|The league id of the league you are interested in. Set to `0` to get a list of all the different leagues and their IDs for this year<br><br>**Default value:** 0|
|`maximumEntries`|Maximum number of teams to display. This option should take an integer value between `1` and the number of teams in the league.<br><br>**Default value:** `9`|
|`interest`|Names of clubs you want to follow as a list of strings<br><br>**Default value:** `[]`|
|`updateInterval`|How often does the content need to be fetched? (Minutes) Note that you have a limited number of requests per week, so don't refresh this module too often!<br><br>**Default value:** `120`|
|`lblAsText`|Boolean if the table header should be displayed as text<br><br>**Default value:** `false`|
|`maxNameLength`|Number of characters of the clubs name to display. This is not an exact value but the name will be abbreviated in a somewhat (but not really) smart way. Best you choose 0 or an integer larger or equal to 9 <br>`0` means display all, <br>`-1` means don't show the clubs names<br><br>**Default value:** `0`||`showCrests`|Boolean if the crest of the clubs should be shown - doesn't work for all teams since images are taken from wikimedia.<br><br>**Default value:** `false`||`showColor`|Boolean if crests should be displayed in color (requires crests to be displayed)<br><br>**Default value:** `false`||`showWhenError`|Boolean if the module should be displayed if there is an error (e.g. if the maximum number of requests has been exceeded).<br><br>**Default value** `true`|

## Settings to try:
Follow Stuttgart in the Bundesliga 17/18
```js
{
    module: 'MMM-FootballTable',
    header: 'Bundesliga',
    position: 'bottom_center',
    config: {
        maximumEntries: 10,
        maxNameLength: 9,
        showCrests: true,
        lblAsText: true, 
        showWhenError: false,
        leagueid: 452,    
        interest: ['VfB Stuttgart'] 
    }  
},
```

Follow Chelsea and Man United in the Premier League 17/18
```
{            
    module: 'MMM-FootballTable',
    header: 'Premier League',
    position: 'top_right', 
    config: {  
        leagueid: 445,  
        interest: ['Chelsea FC','Manchester United FC'],
        maximumEntries: 10
    }   
},
```
