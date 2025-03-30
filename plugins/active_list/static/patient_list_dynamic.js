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

    try {
      const result = await fetchData(dataUrl) // Expects { data: [], count: N } or similar

      if (result && result.data && result.data.length > 0) {
        // TODO: Render the data into a table in tableContainer
        renderTable(result.data) // Implement this function based on your data structure
        excelLink.href = excelUrl
        excelLink.style.display = 'inline-block'
        tableContainer.style.display = 'block'
        noDataMessage.style.display = 'none'
      } else {
        noDataMessage.textContent = 'Pas de données pour cette sélection.'
        noDataMessage.style.display = 'block'
      }
    } catch (error) {
      // Error handled in fetchData
      console.error('Failed to fetch or render patient data.')
      // No data message should already be visible from fetchData error handling
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
  function renderTable (data) {
    // Basic example: create a simple table
    const table = document.createElement('table')
    table.className = 'patient-table' // Add a class for styling
    const thead = table.createTHead()
    const tbody = table.createTBody()
    const headerRow = thead.insertRow()

    // Create headers based on the first data object's keys
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th')
        th.textContent = key.charAt(0).toUpperCase() + key.slice(1) // Capitalize
        headerRow.appendChild(th)
      })
    }

    // Create data rows
    data.forEach(item => {
      const row = tbody.insertRow()
      Object.values(item).forEach(value => {
        const cell = row.insertCell()
        cell.textContent = value
      })
    })

    tableContainer.innerHTML = '' // Clear previous table
    tableContainer.appendChild(table)
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