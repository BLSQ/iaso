var monthSelect = $('#monthSelect')

const orgUnitContainer = document.getElementById('orgUnitContainer')

var dataContainer = $('#dataContainer')

dataContainer.hide()

var orgUnitIdSave = null
var periodSave = null
var callback = function (orgUnitId) {
  orgUnitIdSave = orgUnitId
  periodSave = $('#monthSelect').val()
  $.getJSON('/active_list/validation_region_api/' + orgUnitId + '/' + periodSave, function (data) {

    data.table_content.forEach(item => {
      item.org_unit_id = `<a href="${item.org_unit_id}" class="validate_link">Valider</a>`
    })
    var table = generateTable(data.table_content)
    $('#completeness').text(data.completeness)
    $('#table-container').html(table)
    $('#generatedTable').tablesorter()
    dataContainer.show()
  })

}

monthSelect.on('change', function () {
  $('#period').val(this.value)
  periodSave = this.value
  callback(orgUnitIdSave)
})

const config = {
  targetOrgUnitTypeId: FA_REGION_ORG_UNIT_TYPE_ID,
  callback: callback,
  orgUnitContainer: orgUnitContainer
}

addOrgUnitSelect(config, 0) // Start by adding the first level (e.g., country)
$(document).ready(function () {
  fillSelectWithMonths()
})

$(document).ready(function () {
  // Open the popup
  $('#dataContainer').on('click', '.validate_link', function (event) {
    event.preventDefault()
    var org_unit_id = $(this).attr('href')
    $('#id_org_unit').val(org_unit_id)
    $('#id_period').val(periodSave)
    $('#validation_form').show()
    $('.overlay').show()
  })

  // Close the popup
  $('#closePopup').click(function () {
    $('#validation_form').hide()
    $('.overlay').hide()
  })

  // Close the popup when clicking on the overlay
  $('.overlay').click(function () {
    $('#validation_form').hide()
    $('.overlay').hide()
  })

  $('#validation_form form').on('submit', function (event) {
    // Prevent the default form submission behavior
    event.preventDefault()

    // Get the form element
    var form = $(this)
    // Get the URL to send the data to (from the form's action attribute)
    var url = form.attr('action')
    // Serialize the form data into a query string format (e.g., name=John&email=...)
    var formData = form.serialize()
    console.log("formData", formData)
    // Perform the AJAX request
    $.ajax({
      type: "POST", // e.g., 'POST'
      url: url,
      data: formData, // The serialized form data
      success: function (response) {
          $('#validation_form').hide()
          $('.overlay').hide()
          callback(orgUnitIdSave)
      },
      error: function (xhr, status, error) {
        // This function runs if the AJAX request itself fails (e.g., network error, server error 500)
        console.error('AJAX Error:', status, error)
        console.error('Response Text:', xhr.responseText)

      },
      complete: function () {
        // This function runs after success or error
        // You could hide a loading indicator here if you didn't reload on success
        console.log('AJAX request completed.')
      }
    })
  })
})