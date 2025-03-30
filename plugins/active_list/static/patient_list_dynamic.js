document.addEventListener('DOMContentLoaded', function () {
  const orgUnitContainer = document.getElementById('orgUnitContainer')
  const monthSelect = document.getElementById('monthSelect')
  const modeSelect = document.getElementById('modeSelect')
  const dataContainer = document.getElementById('dataContainer')
  const tableContainer = document.getElementById('table-container')
  const excelLink = document.getElementById('excel_link')
  const noDataMessage = document.getElementById('nodata')
  let selectedOrgUnit = null;

  async function fetchPatientData () {
    hideData() // Clear previous results and hide elements

    // Find the ID of the most specific selected org unit
    let finalOrgUnitId = null

    // Get other filter values
    const selectedMonth = monthSelect.value
    const selectedMode = modeSelect.value

    // Only fetch data if a month and at least one org unit level (or the intended level) is selected
    if (!selectedMonth || !selectedOrgUnit) {
      console.log('Month or final org unit not selected. Not fetching patient data.')
      // Optionally show a message like "Please select month and an org unit"
      noDataMessage.textContent = 'Veuillez sélectionner une période et au moins un niveau d\'établissement.'
      noDataMessage.style.display = 'block'
      return
    }

    const dataUrl = `/active_list/patient_list_api/${selectedOrgUnit}/${selectedMonth}/?mode=${selectedMode}`
    const excelUrl = dataUrl + '&xls=true' // Assuming separate excel endpoint
    console.log(`fetching patient data from: ${dataUrl}`)

      const result = await fetchData(dataUrl) // Expects { data: [], count: N } or similar
      console.log("result", result)
      if (result && result.table_content && result.table_content.length > 0) {
        // TODO: Render the data into a table in tableContainer
        renderTable(result.table_content, dataUrl) // Implement this function based on your data structure
        excelLink.href = excelUrl
        excelLink.style.display = 'inline-block'
        tableContainer.style.display = 'block'
        noDataMessage.style.display = 'none'
      } else {
        noDataMessage.textContent = 'Pas de données pour cette sélection.'
        noDataMessage.style.display = 'block'
      }

  }

  /** Hides data display elements */
  function hideData () {
    tableContainer.innerHTML = '' // Clear table
    tableContainer.style.display = 'none'
    excelLink.style.display = 'none'
    excelLink.href = '#'
    noDataMessage.style.display = 'none'
  }

  /**
   * Renders the patient data into a table (Example Implementation).
   * @param {Array<object>} data - Array of patient objects.
   */
  function renderTable (data, url) {
    // Basic example: create a simple table
    var table = generateTable(data)
    console.log(table);
    $('#table-container').html(table)

    var excel_link = $('#excel_link')
    if (data.length === 0) {
      excel_link.hide()
      $('#nodata').show()
    } else {
      excel_link.attr('href', url + '&xls=true')
      excel_link.show()
      $('#nodata').hide()
    }
    $('#generatedTable').tablesorter()
  }

  function callback (selectedOrgUnitId) {
    console.log("selectedOrgUnitId", selectedOrgUnitId)
    selectedOrgUnit = selectedOrgUnitId;
    fetchPatientData();
  }

  const config = {
    targetOrgUnitTypeId: 350,
    callback: callback,
    orgUnitContainer: orgUnitContainer
  }

  addOrgUnitSelect(config, 0) // Start by adding the first level (e.g., country)
  monthSelect.addEventListener('change', fetchPatientData)
  modeSelect.addEventListener('change', fetchPatientData)
})