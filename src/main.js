// On every function call, Google Apps Script executes the entire project, so the below values will always be properly initialized
// See https://stackoverflow.com/a/59791440/

const CONFIG_SHEET_NAME = "Settings"
const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME)

if (configSheet === null) {
	throw new Error(`Could not find sheet "${CONFIG_SHEET_NAME}".`)
}

const endpoint = configSheet.getRange("B2").getValues()
const clusterName = configSheet.getRange("B3").getValue()
const databaseName = configSheet.getRange("B4").getValue()
const collectionName = configSheet.getRange("B5").getValue()
const apiKey = configSheet.getRange("B6").getValue()

Logger.log(
	`endpoint = ${endpoint}
clusterName = ${clusterName}
databaseName = ${databaseName}
collectionName = ${collectionName}
apiKey = ${apiKey}`
)

const columnVals = [
	"Part Name",
	"Barcode",
	"Datasheet",
	"Is Consumable",
	"Description",
	"Stock",
	"Category",
	"Image URL",
]

function getAllBarcodes() {

	var sheet = SpreadsheetApp.getActiveSheet()
	var data = sheet.getDataRange().getValues()

	// create endpoint to find all parts
	const findEndpoint = endpoint + "/action/find"

	const payload = {
		collection: collectionName,
		database: databaseName,
		dataSource: clusterName
	}

	const options = {
		method: 'post',
		contentType: 'application/json',
		payload: JSON.stringify(payload),
		headers: { "api-key": apiKey }
	}
	const response = UrlFetchApp.fetch(findEndpoint, options);

	// parse response object to a JS Object
	const parsedResponse = JSON.parse(response.getContentText())

	const allParts = parsedResponse.documents

	// add barcodes to a set for constant time lookup
	const barcodes = new Set()
	for (let i = 0; i < allParts.length; i++) {
		barcodes.add(allParts[i].barcode)
	}

	return barcodes

}


function checkFormatting() {
	const sheet = SpreadsheetApp.getActiveSheet()
	const data = sheet.getDataRange().getValues()

	// loop through each row
	for (let row = 1; row < data.length; row++) {
		for (let col = 0; col < columnVals.length; col++) {
			// check for empty cells
			if (data[row][col] === "") {
				SpreadsheetApp.getUi().alert("Empty cell at \nRow: " + (row + 1).toString() + ". \nColumn: " + columnVals[col])
				return false
			}

			// make sure isConsumable is set to true/false
			if (col === 3) {
				if (data[row][col] !== true && data[row][col] !== false) {
					SpreadsheetApp.getUi().alert(
						"Issue with:\nRow: " +
							(row + 1).toString() +
							". \nColumn: " +
							columnVals[col] +
							"\nIs Consumable column must be set to true or false"
					)
					return false
				}
			}

			// check that stock is an integer value
			if (col === 5) {
				// if parsing the element to an int returns a NaN, then it's probably not an integer
				if (isNaN(parseInt(data[row][col]))) {
					SpreadsheetApp.getUi().alert(
						"Stock must be a number:\nRow: " + (row + 1).toString() + ". \nColumn: " + columnVals[col]
					)
					return false
				}
			}
		}
	}

	SpreadsheetApp.getUi().alert("No formatting issues detected")
	return true
}

function findPart(partBarcode, apiKey) {
	// create find endpoint
	const findEndpoint = endpoint + "/action/findOne"

	// query to search via barcode
	const query = { barcode: partBarcode }

	const payload = {
		filter: query,
		collection: collectionName,
		database: databaseName,
		dataSource: clusterName,
	}

	const options = {
		method: "post",
		contentType: "application/json",
		payload: JSON.stringify(payload),
		headers: { "api-key": apiKey },
	}

	const response = UrlFetchApp.fetch(findEndpoint, options)

	// parse response object to a JS Object
	const parsedResponse = JSON.parse(response.getContentText())

	if (parsedResponse.document === null) {
		// part didn't exist in database
		return false
	} else {
		// part exists in database
		return true
	}
}

function insertParts() {
	// add insert action to endpoint
	const insertEndpoint = endpoint + "/action/insertMany"
	
	const allBarcodes = getAllBarcodes()
	const duplicateParts = []
	const partsToInsert = []
	
	if (!checkFormatting()) {
		return
	}

	const sheet = SpreadsheetApp.getActiveSheet()
	const data = sheet.getDataRange().getValues()

	// loop through each row (excluding 1st row)
	for (let row = 1; row < data.length; row++) {
		// add in each row element
		const document = {}

		document.partName = data[row][0]
		document.barcode = data[row][1]
		document.datasheet = data[row][2]
		document.isConsumable = data[row][3]
		document.description = data[row][4]
		document.stock = parseInt(data[row][5])
		document.category = data[row][6]
		document.imageUrl = data[row][7]
		document.type = data[row][3] ? "Consumable" : "Returnable"

		// if part with matching barcode found
		if (allBarcodes.has(document.barcode)) {
			// push the row # + 1 to the array
			duplicateParts.push(row + 1)
		}
		else {
			partsToInsert.push(document)
		}
	}

	const payload = {
		documents: partsToInsert,
		collection: collectionName,
		database: databaseName,
		dataSource: clusterName,
	}

	  const options = {
		method: "post",
		contentType: "application/json",
		payload: JSON.stringify(payload),
		headers: { "api-key": apiKey },
	  }
  
	// make sure partsToInsert isn't empty
	if (partsToInsert.length > 0) {
		const response = UrlFetchApp.fetch(insertEndpoint, options)    
	}

	if (duplicateParts.length === 0) {
		SpreadsheetApp.getUi().alert("Success! All parts added!")
	} 
	else {
		SpreadsheetApp.getUi().alert("Duplicate parts in rows: " + duplicateParts + "\nNon-duplicate items were inserted successfully")
	}
}

function clearSheet() {
	const sheet = SpreadsheetApp.getActiveSheet()
	const data = sheet.getDataRange().getValues()
	sheet.getRange(2, 1, data.length, 8).clearContent()
}

function viewParts() {
	const sheet = SpreadsheetApp.getActiveSheet()
	const data = sheet.getDataRange().getValues()

	// delete previous data
	clearSheet()

	// create endpoint to find all parts
	const findEndpoint = endpoint + "/action/find"

	const payload = {
		collection: collectionName,
		database: databaseName,
		dataSource: clusterName,
	}

	const options = {
		method: "post",
		contentType: "application/json",
		payload: JSON.stringify(payload),
		headers: { "api-key": apiKey },
	}

	const response = UrlFetchApp.fetch(findEndpoint, options)

	// parse response object to a JS Object
	const parsedResponse = JSON.parse(response.getContentText())

	const allParts = parsedResponse.documents

	for (let i = 0; i < allParts.length; i++) {
		const part = allParts[i]
		const rowValues = [
			part.partName,
			part.barcode,
			part.datasheet,
			part.isConsumable,
			part.description,
			part.stock,
			part.category,
			part.imageUrl,
		]

		sheet.getRange(i + 2, 1, 1, rowValues.length).setValues([rowValues])
	}
}

function updateParts() {
	// add insert action to endpoint
	const updateEndpoint = endpoint + "/action/updateOne"

	const invalidParts = []

	if (!checkFormatting()) {
		return
	}

	const sheet = SpreadsheetApp.getActiveSheet()
	const data = sheet.getDataRange().getValues()

	// loop through each row (excluding 1st row)
	for (let row = 1; row < data.length; row++) {
		// add in each row element
		const update = {}

		const barcode = data[row][1]

		update.partName = data[row][0]
		update.datasheet = data[row][2]
		update.isConsumable = data[row][3]
		update.description = data[row][4]
		update.stock = parseInt(data[row][5])
		update.category = data[row][6]
		update.imageUrl = data[row][7]
		update.type = data[row][3] ? "Consumable" : "Returnable"

		// if no parts with matching barcode found
		if (!findPart(barcode, apiKey)) {
			// push the row # + 1 to the array
			invalidParts.push(row + 1)

			// skip current iteration and go to next loop iteration
			continue
		}

		const payload = {
			collection: collectionName,
			database: databaseName,
			dataSource: clusterName,
			filter: { barcode },
			update: { $set: update },
			upsert: false,
		}

		const options = {
			method: "post",
			contentType: "application/json",
			payload: JSON.stringify(payload),
			headers: { "api-key": apiKey },
		}

		const response = UrlFetchApp.fetch(updateEndpoint, options)
	}

	if (invalidParts.length === 0) {
		SpreadsheetApp.getUi().alert("Success! All parts updated!")
	} else {
		SpreadsheetApp.getUi().alert(
			"Invalid part barcodes in rows: " + invalidParts + "\nOther parts were inserted successfully"
		)
	}
}

function deleteParts() {
	const sheet = SpreadsheetApp.getActiveSheet()
	const data = sheet.getDataRange().getValues()

	const invalidBarcodeRows = []

	const deleteEndpoint = endpoint + "/action/deleteOne"

	for (let row = 1; row < data.length; row++) {
		const barcodeToDelete = data[row][0]

		if (!findPart(barcodeToDelete, apiKey)) {
			invalidBarcodeRows.push(row + 1)
			continue
		}

		// query to search via barcode
		const query = { barcode: barcodeToDelete }

		const payload = {
			filter: query,
			collection: collectionName,
			database: databaseName,
			dataSource: clusterName,
		}

		const options = {
			method: "post",
			contentType: "application/json",
			payload: JSON.stringify(payload),
			headers: { "api-key": apiKey },
		}

		const response = UrlFetchApp.fetch(deleteEndpoint, options)
	}

	if (invalidBarcodeRows.length === 0) {
		SpreadsheetApp.getUi().alert("All parts with barcodes specified were deleted successfully")
	} else {
		SpreadsheetApp.getUi().alert(
			"Invalid barcode in rows: " + invalidBarcodeRows + "\nAll other parts were deleted successfully"
		)
	}
}
