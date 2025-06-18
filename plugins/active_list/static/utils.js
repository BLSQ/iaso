function fillSelect (select, data) {
  $(select).empty()
  $(select).append('<option disabled selected value> -- Choisissez -- </option>')
  $(data).each(function () {
    $(select).append($('<option>').attr('value', this.id).text(this.name))
  })
}

function submitForm (formData) {
  $('#link').hide()
  $('#loader').show()
  $.ajax({
    url: '/active_list/upload/',  // Replace with your form action URL
    type: 'POST',
    data: formData,
    processData: false, // Important: Prevent jQuery from processing the data
    contentType: false, // Important: Prevent jQuery from setting content type
    success: function (response) {
      // Handle the successful response from the server
      console.log('File uploaded successfully!', response)
      $('#loader').hide()
      alert(response['message'])
      console.log("/active_list/patient_list/")
      window.location.href = '/active_list/patient_list/'
    },
    error: function (xhr, status, error) {
      // Handle errors
      $('#loader').hide()
      $('#link').show()
      var response = xhr.responseJSON
      if (response['bypassable']) {
        if (confirm(response['message'])) {
          $('#bypass').val(1)
          formData.set('bypass', 1)
          submitForm(formData)
        }
      } else {
        alert(response['message']);
        if (response.download_id) {
          // If a download ID is provided, trigger the download
          downloadFileWithAnchor(`/active_list/download/?id=${response.download_id}`)
        }
      }
    }
  })
}

function downloadFileWithAnchor(path) {
  const downloadUrl = path;

  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = downloadUrl;

  // Set the download attribute. This attribute suggests a filename to the browser.
  // While the server's Content-Disposition header is primary, this can be a fallback
  // or a way to suggest a name if the server doesn't set one (though it should).
  // You might not know the exact filename here, so you can omit it or make a guess.
  link.setAttribute('download', 'annotated_file'); // Suggests a filename

  // Append to the document, click, and then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Or link.remove() in modern browsers
}

function generateMonthList () {
  const months = []
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  for (let i = -12; i < 1; i++) {
    let newDate = new Date(currentYear, currentMonth - 1 + i, 1)
    let year = newDate.getFullYear()
    let month = (newDate.getMonth() + 1).toString().padStart(2, '0') // Add leading zero if needed
    months.push(`${year}-${month}`)
  }

  return months
}

function fillSelectWithMonths () {
  const months = generateMonthList()
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ]
  const selectBox = document.getElementById('monthSelect')

  for (let i = 0; i < months.length; i++) {
    const [year, month] = months[i].split('-')
    const monthIndex = parseInt(month, 10) - 1
    const monthName = monthNames[monthIndex]
    const option = document.createElement('option')
    option.value = months[i]
    option.text = `${monthName} ${year}`
    selectBox.add(option)
  }
  selectBox.value = months[11]
  $('#period').val(months[11])
}

function formatTimestamp(timestamp) {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: 'UTC', // Important: Keep the timestamp in UTC
  };

  const date = new Date(timestamp);
  return date.toLocaleString(navigator.language, options);
}


/**
 * Enhanced table initialization with sticky headers using tablesorter widget
 * Call this after creating tables with tablesorter
 */
function initializeTableWithStickyHeaders(tableSelector = '#generatedTable') {
    console.log('🔧 Initializing tablesorter with sticky header widget for:', tableSelector);
    
    // Initialize tablesorter with sticky header widget
    if (typeof $.fn.tablesorter !== 'undefined') {
        $(tableSelector).tablesorter({
            theme: 'default',
            widgets: ['stickyHeaders'],
            widgetOptions: {
                stickyHeaders: '',
                stickyHeaders_offset: 0,
                stickyHeaders_cloneId: '-sticky',
                stickyHeaders_addResizeEvent: true,
                stickyHeaders_includeCaption: true,
                stickyHeaders_zIndex: 1000
            }
        });
        console.log('✅ Tablesorter with sticky headers initialized for:', tableSelector);
    } else {
        console.error('❌ Tablesorter not available');
    }
}

function generateTable (data) {
  var table = $('<table id="generatedTable"></table>') // Create the table element
  var thead = $('<thead></thead>')
  var tbody = $('<tbody></tbody>')
  // Create table header row
  var headerRow = $('<tr></tr>')
  for (var key in data[0]) { // Assuming all objects have the same keys
    headerRow.append($('<th></th>').text(key))
  }
  thead.append(headerRow)
  table.append(thead)

  // Create table data rows
  $(data).each(function (index, obj) {
    var row = $('<tr></tr>')
    for (var key in obj) {
      row.append($('<td></td>').html(obj[key]))
    }
    tbody.append(row)
  })
  table.append(tbody)
  return table
}

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/html')) {
            return await response.text(); // Return HTML as text.
        } else {
            // Handle other content types, or return text as a fallback.
            return await response.text();
        }

    } catch (error) {
        console.error(error); // Use console.error for errors.
        throw error; // Re-throw to stop subsequent actions
    }
}

  /**
   * Populates a select element with options.
   * @param {HTMLSelectElement} selectElement - The select element to populate.
   * @param {Array<object>} data - Array of objects, each with 'id' and 'name'.
   * @param {string} placeholder - Text for the default disabled option.
   */
  function populateSelect (selectElement, data, placeholder) {
    selectElement.innerHTML = '' // Clear existing options
    const placeholderOption = document.createElement('option')
    placeholderOption.value = ''
    placeholderOption.textContent = placeholder
    placeholderOption.disabled = true
    placeholderOption.selected = true
    selectElement.appendChild(placeholderOption)

    data.forEach(item => {
      const option = document.createElement('option')
      option.value = item.id
      option.textContent = item.name // Assuming API returns {id: '...', name: '...'}
      option.dataset.orgUnitTypeId = item.org_unit_type_id
      selectElement.appendChild(option)
    })
    selectElement.disabled = false
  }

  /**
   * Creates and adds the next level select element.
   * @param {number} levelIndex - The index of the level to create (from config.levels).
   * @param {string|null} parentId - The ID of the selected item in the parent level, or null for the first level.
   */
  async function addOrgUnitSelect (config, levelIndex, parentId = null) {
    const selectId = `Select${levelIndex}`

    const select = document.createElement('select')
    select.id = selectId
    select.className = "orgUnitSelect"
    select.name = selectId
    select.disabled = true // Disable until populated
    select.dataset.levelIndex = levelIndex // Store level index for the event handler

    // Add placeholder option immediately
    const placeholderOption = document.createElement('option')
    placeholderOption.value = ''
    placeholderOption.textContent = `Sélectionnez...`
    placeholderOption.disabled = true
    placeholderOption.selected = true
    select.appendChild(placeholderOption)

    // Append to container
    const orgUnitContainer = config.orgUnitContainer;
    orgUnitContainer.appendChild(select)
    // --- Fetch Data and Populate ---
    let apiUrl = `/api/orgunits/tree/?validation_status=VALID&ignoreEmptyNames=true` // e.g., /api/orgunits/country/
    if (parentId) {
      apiUrl += `&parent_id=${parentId}` // e.g., /api/orgunits/region/?country_id=123
    }

    try {
      const data = await fetchData(apiUrl)
      if (data && data.length > 0) {
        populateSelect(select, data, `Sélectionnez ...`)
        select.addEventListener('change', handleOrgUnitChangeGenerator(config))
      } else {
        select.innerHTML = '<option value="">Pas de résultats</option>'
        select.disabled = true;
      }
    } catch (error) {
      // Error handled in fetchData, but ensure select stays disabled/informative
      select.innerHTML = `<option value="">Erreur chargement</option>`
      select.disabled = true
    }
  }

  /**
   * Handles changes in any org unit select.
   * @param {Event} event - The change event object.
   */
  function handleOrgUnitChangeGenerator (config) {
    return function handleOrgUnitChange (event) {
    const selectElement = event.target
    const selectedOption = selectElement.options[selectElement.selectedIndex]
    const selectedValue = selectElement.value
    const orgUnitContainer = config.orgUnitContainer;
    const selectedOrgUnitTypeId = selectedOption.dataset.orgUnitTypeId
    const currentLevelIndex = parseInt(selectElement.dataset.levelIndex, 10)

    // Remove all subsequent select elements
    let nextElement = selectElement.nextElementSibling // Start checking after the current select
    while (nextElement) {
      const elementToRemove = nextElement
      nextElement = nextElement.nextElementSibling // Move to the next before removing
      // Only remove elements created by this script (labels and selects)
      if (elementToRemove.tagName === 'LABEL' || elementToRemove.tagName === 'SELECT') {
        orgUnitContainer.removeChild(elementToRemove)
      }
    }

    if (selectedValue) {
      // Add the next level select

      if (selectedOrgUnitTypeId == config.targetOrgUnitTypeId) {
        config.callback(selectedValue);
      } else {
        addOrgUnitSelect(config,currentLevelIndex + 1, selectedValue)
      }
    } else {
      // If user deselects (e.g. back to placeholder), ensure data is fetched if needed (or cleared)
      config.callback()
    }}
  }
