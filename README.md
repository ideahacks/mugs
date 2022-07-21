# MIGS

MIGS (MongoDB in Google Sheets) performs CRUD operations on a MongoDB database,
using information from spreadsheets in Google Sheets.

IDEA Hacks uses MIGS to interface with the parts database. Since we run a
hardware hackathon, we lend out parts for teams to use.

## Developing

Run `npm install` to get started.

You'll also need a Google Sheets spreadsheet you have edit access to, which the
Apps Script project is bound to.

### `clasp`

[`clasp`](https://github.com/google/clasp) is used to update the Apps Script
project.

1.  Run [`clasp login`](https://github.com/google/clasp#login) to log in with
    your Google Account.

1.  `cd` to the `src` directory, then run [`clasp setting <Script ID>`]
    (https://github.com/google/clasp#setting=). Use the Script ID for the
    spreadsheet you'd like to edit.

    To find the Script ID: With the spreadsheet open, select Extensions > Apps
    Script; in the Apps Script page that opens, the Script ID is the
    alphanumeric string following ".../projects/").

    For example, while in the `src` directory run `clasp setting 15ImUCpyi1Jsd8yF8Z6wey_7cw793CymWTLxOqwMka3P1CzE5hQun6qiC`.

1.  When you're done modifying the Apps Script project (in the `src` directory),
    push your changes using [`clasp push`]
    (https://github.com/google/clasp#push).

## Contributors

Thanks to Kevin Zhang for writing most of the original Apps Script code.
