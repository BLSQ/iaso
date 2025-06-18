document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, initializing imports list...')
  
  const orgUnitContainer = document.getElementById('orgUnitContainer')
  const statusSelect = document.getElementById('statusSelect')
  const pageSizeSelect = document.getElementById('pageSizeSelect')
  const resetFiltersBtn = document.getElementById('resetFilters')
  const dataContainer = document.getElementById('dataContainer')
  const tableContainer = document.getElementById('table-container')
  const noDataMessage = document.getElementById('nodata')
  const loadingIndicator = document.getElementById('loading')
  const paginationContainer = document.getElementById('paginationContainer')
  const paginationInfo = document.getElementById('paginationInfo')
  
  // Check if all required elements are found
  console.log('Elements found:', {
    orgUnitContainer: !!orgUnitContainer,
    statusSelect: !!statusSelect,
    pageSizeSelect: !!pageSizeSelect,
    resetFiltersBtn: !!resetFiltersBtn,
    dataContainer: !!dataContainer,
    tableContainer: !!tableContainer,
    noDataMessage: !!noDataMessage,
    loadingIndicator: !!loadingIndicator,
    paginationContainer: !!paginationContainer,
    paginationInfo: !!paginationInfo
  })
  
  let selectedOrgUnit = null
  let currentPage = 1
  let isLoading = false
  
  /**
   * Fetches imports data from the API
   */
  async function fetchImportsData() {
    if (isLoading) return
    
    isLoading = true
    hideData()
    showLoading()
    
    try {
      // Build API URL with parameters
      const params = new URLSearchParams()
      if (selectedOrgUnit) {
        params.append('org_unit_id', selectedOrgUnit)
      }
      if (statusSelect.value) {
        params.append('status', statusSelect.value)
      }
      params.append('page', currentPage)
      params.append('page_size', pageSizeSelect.value)
      
      const apiUrl = `/active_list/imports_list_api/?${params.toString()}`
      console.log('Fetching imports data from:', apiUrl)
      
      // Check if fetchData function is available
      if (typeof fetchData === 'undefined') {
        console.error('fetchData function not found! Falling back to fetch')
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Data fetched via fallback:', data)
        handleApiResponse(data)
      } else {
        const data = await fetchData(apiUrl)
        console.log('Data fetched via fetchData:', data)
        handleApiResponse(data)
      }
    } catch (error) {
      console.error('Error fetching imports data:', error)
      showNoData('Erreur lors du chargement des données')
    } finally {
      hideLoading()
      isLoading = false
    }
  }
  
  /**
   * Handles the API response
   */
  function handleApiResponse(data) {
    console.log('Imports data received:', data)
    console.log('Table content:', data.table_content)
    console.log('Pagination:', data.pagination)
    
    // Always render pagination if it exists
    if (data.pagination) {
      renderPagination(data.pagination)
      updatePaginationInfo(data.pagination)
    }
    
    if (data.table_content && data.table_content.length > 0) {
      console.log('Rendering table with', data.table_content.length, 'items')
      renderTable(data.table_content)
      showData()
    } else {
      console.log('No data to display')
      showNoData()
    }
  }
  
  /**
   * Renders the imports table
   */
  function renderTable(tableContent) {
    console.log('renderTable called with:', tableContent)
    
    if (typeof generateTable === 'undefined') {
      console.error('generateTable function not found!')
      // Fallback: create simple table
      createSimpleTable(tableContent)
      return
    }
    
    try {
      const table = generateTable(tableContent)
      console.log('Table generated:', table)
      tableContainer.innerHTML = ''
      tableContainer.appendChild(table)
      
      // Initialize tablesorter if available
      if (typeof $.fn.tablesorter !== 'undefined') {
        $('#generatedTable').tablesorter()
      }
    } catch (error) {
      console.error('Error generating table:', error)
      createSimpleTable(tableContent)
    }
  }
  
  /**
   * Fallback function to create a simple table
   */
  function createSimpleTable(tableContent) {
    console.log('Creating simple table as fallback')
    
    if (!tableContent || tableContent.length === 0) {
      tableContainer.innerHTML = '<p>Aucune donnée à afficher</p>'
      return
    }
    
    // Create table element
    const table = document.createElement('table')
    table.id = 'generatedTable'
    table.className = 'table table-striped table-hover'
    
    // Create header
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    
    // Get headers from first row keys
    const headers = Object.keys(tableContent[0])
    headers.forEach(header => {
      const th = document.createElement('th')
      th.textContent = header
      headerRow.appendChild(th)
    })
    
    thead.appendChild(headerRow)
    table.appendChild(thead)
    
    // Create body
    const tbody = document.createElement('tbody')
    tableContent.forEach(row => {
      const tr = document.createElement('tr')
      headers.forEach(header => {
        const td = document.createElement('td')
        td.innerHTML = row[header] || ''
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    
    table.appendChild(tbody)
    
    // Clear and add table
    tableContainer.innerHTML = ''
    tableContainer.appendChild(table)
  }
  
  /**
   * Renders pagination controls
   */
  function renderPagination(pagination) {
    const prevPage = document.getElementById('prevPage')
    const nextPage = document.getElementById('nextPage')
    const currentPageSpan = document.getElementById('currentPageSpan')
    
    // Update current page display
    currentPageSpan.textContent = pagination.current_page
    
    // Update previous page button
    if (pagination.has_previous) {
      prevPage.classList.remove('disabled')
      prevPage.onclick = () => goToPage(pagination.current_page - 1)
    } else {
      prevPage.classList.add('disabled')
      prevPage.onclick = null
    }
    
    // Update next page button
    if (pagination.has_next) {
      nextPage.classList.remove('disabled')
      nextPage.onclick = () => goToPage(pagination.current_page + 1)
    } else {
      nextPage.classList.add('disabled')
      nextPage.onclick = null
    }
    
    // Show pagination navigation if more than one page
    if (pagination.total_pages > 1) {
      paginationContainer.style.display = 'block'
    } else {
      paginationContainer.style.display = 'none'
    }
  }
  
  /**
   * Updates pagination information text
   */
  function updatePaginationInfo(pagination) {
    const start = ((pagination.current_page - 1) * parseInt(pagination.page_size)) + 1
    const end = Math.min(pagination.current_page * parseInt(pagination.page_size), pagination.total_count)
    
    paginationInfo.textContent = `${start}-${end} sur ${pagination.total_count} résultats`
  }
  
  /**
   * Navigates to a specific page
   */
  function goToPage(page) {
    if (isLoading) return
    
    currentPage = page
    fetchImportsData()
  }
  
  /**
   * Shows loading indicator
   */
  function showLoading() {
    loadingIndicator.style.display = 'block'
  }
  
  /**
   * Hides loading indicator
   */
  function hideLoading() {
    loadingIndicator.style.display = 'none'
  }
  
  /**
   * Shows data container
   */
  function showData() {
    tableContainer.style.display = 'block'
    noDataMessage.style.display = 'none'
  }
  
  /**
   * Shows no data message
   */
  function showNoData(message = null) {
    tableContainer.style.display = 'none'
    // Don't hide pagination container - it will be handled by renderPagination
    
    if (message) {
      noDataMessage.querySelector('strong').textContent = message
    }
    noDataMessage.style.display = 'block'
  }
  
  /**
   * Hides all data displays
   */
  function hideData() {
    tableContainer.style.display = 'none'
    noDataMessage.style.display = 'none'
    paginationContainer.style.display = 'none'
  }
  
  /**
   * Callback function for org unit selection
   */
  function handleOrgUnitSelection(orgUnitId) {
    console.log('Org unit selected:', orgUnitId)
    selectedOrgUnit = orgUnitId
    currentPage = 1 // Reset to first page when filtering
    fetchImportsData()
  }
  
  /**
   * Resets all filters
   */
  function resetFilters() {
    // Clear org unit selection
    selectedOrgUnit = null
    currentPage = 1
    
    // Clear org unit selectors
    orgUnitContainer.innerHTML = ''
    
    // Reset status filter
    statusSelect.value = ''
    
    // Reset page size to default
    pageSizeSelect.value = '20'
    
    // Reinitialize org unit selector
    addOrgUnitSelect(orgUnitConfig, 0)
    
    // Fetch data without filters
    fetchImportsData()
  }
  
  // Configuration for org unit selector
  const orgUnitConfig = {
    targetOrgUnitTypeId: FA_HF_ORG_UNIT_TYPE_ID, // Target health facilities
    callback: handleOrgUnitSelection,
    orgUnitContainer: orgUnitContainer
  }
  
  // Event listeners
  statusSelect.addEventListener('change', function() {
    currentPage = 1 // Reset to first page when changing status filter
    fetchImportsData()
  })
  
  pageSizeSelect.addEventListener('change', function() {
    currentPage = 1 // Reset to first page when changing page size
    fetchImportsData()
  })
  
  resetFiltersBtn.addEventListener('click', resetFilters)
  
  // Initialize the page
  console.log('Initializing imports list page...')
  
  // Check if addOrgUnitSelect function is available
  if (typeof addOrgUnitSelect !== 'undefined') {
    console.log('Adding org unit selector...')
    addOrgUnitSelect(orgUnitConfig, 0) // Start with first level selector
  } else {
    console.warn('addOrgUnitSelect function not found, org unit filtering will not be available')
  }
  
  // Load initial data
  console.log('Loading initial data...')
  fetchImportsData()
})