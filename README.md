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

Run [`clasp login`](https://github.com/google/clasp#login) to log in with your
Google Account.

When you're done modifying the Apps Script project (in the `src` directory),
push your changes using [`clasp push`](https://github.com/google/clasp#push).

## Contributors

Thanks to Kevin Zhang for writing most of the original Apps Script code.
