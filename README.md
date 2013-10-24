hall.com.js
===========

### Features

1. Stylesheet (CSS)
  * changes background of 'current-user' to blue
  * changes backgroung of 'git-bot' to red
  * syntax highlighting
  * multi-line pre to normal font (not fixed)
  * highlights current user's name in red
  * highlights other user's name in grey

2. User highlighting
  * finds all users from all rooms in first (top) list
  * adds span around users' name(s):
  ** first, last, firstL (where L is the first letter of last name) and display_name
  *** NB: last name has to be 3 letters or it's ignored

3. Syntax highlighting
  * block must begin with forward slash language or code:
    * /code ...
    * /html ...
    * /css  ...
    * /js   ...
    * /php  ...
    * /sql  ...
    * /xml  ...
  * if more than 7 lines - autmatically add line numbers

4. Bugtracker (MarketLeader specfic)
  * VIS-1234 is parsed as a bug reference and is made into a link (ML only)

5. Watches
  * watches the OL's for new messages - sometimes it doesn't get the proper set up and you need to go to a room and refresh - especially on 1on1 conversations

6. Horizontal row
  * 10 or more dashes are converted to an hr tag


### Installation

1. Save to CRX to computer
  1. https://github.com/caseman72/hall.com.js/blob/master/extension/hall.com.hl.js.crx
  2. "Right Click" and select a variation of "Save As..."
  3. Save to "Desktop"

2. Open Chrome Extensions
  1. chrome://extensions/

3. Drag and Drop CRX file onto Extensions window
  1. It will ask you to add CRX file - click "Add"

4. The extension will autoupdate via github but you can click "Update Extensions Now" to force a check/update.

