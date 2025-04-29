var monthSelect = $('#monthSelect')
var link = $('#link')
const orgUnitContainer = document.getElementById('orgUnitContainer')

link.hide()

monthSelect.on('change', function () {
  $('#period').val(this.value)
})

function callback (selectedOrgUnitId) {
  $('#org_unit_id').val(selectedOrgUnitId)
  link.show()
}

const config = {
  targetOrgUnitTypeId: FA_HF_ORG_UNIT_TYPE_ID,
  callback: callback,
  orgUnitContainer: orgUnitContainer
}

addOrgUnitSelect(config, 0) // Start by adding the first level (e.g., country)

$(document).ready(function () {
  $('form').submit(function (event) {
    event.preventDefault()

    var formData = new FormData(this)

    submitForm(formData)
  })

  fillSelectWithMonths()
})