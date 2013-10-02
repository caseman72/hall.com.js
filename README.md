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
  * {{ code }} is the syntax
  * defaults to javascript (js) js{{ code }}
  * available parsers: html, css, js, php, sql, xml
  * if more than 7 lines - autmatically add line numbers

4. Bugtracker (MarketLeader specfic)
  * VIS-1234 is parsed as a bug reference and is made into a link (ML only)

5. Watches
  * watches the OL's for new messages - sometimes it doesn't get the proper set up and you need to go to a room and refresh - especially on 1on1 conversations

6. Horizontal row
  * 10 or more dashes are converted to an hr tag