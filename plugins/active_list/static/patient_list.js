var monthSelect = $('#monthSelect');
var regionSelect = $('#regionSelect');
var districtSelect = $('#districtSelect');
var facilitySelect = $('#facilitySelect')

var dataContainer = $('#dataContainer');
regionSelect.hide();
districtSelect.hide();
facilitySelect.hide();
dataContainer.hide();
monthSelect.on('change', function () {
  $('#period').val(this.value);
});

$.getJSON('/api/orgunits/tree/?parent_id=2247722&validation_status=VALID&ignoreEmptyNames=true', function (data) {

  fillSelect('#regionSelect', data);
  regionSelect.show();
});

regionSelect.on('change', function () {
  districtSelect.hide();
  facilitySelect.hide();
  $.getJSON('/api/orgunits/tree/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    fillSelect('#districtSelect', data);

    districtSelect.show();
    dataContainer.hide();
  });
});
districtSelect.on('change', function () {
  facilitySelect.hide()
  $.getJSON('/api/orgunits/tree/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    fillSelect('#facilitySelect', data)
    facilitySelect.show()
  })
})

facilitySelect.on('change', function () {
  $.getJSON('/api/orgunits/tree/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    var orgUnitId = facilitySelect.val();
    var period = monthSelect.val();
    $.getJSON('/active_list/patient_list_api/' + orgUnitId + '/' + period +'/', function (data) {
      var table = generateTable(data.table_content);

      $('#table-container').html(table);
      $("#generatedTable").tablesorter();
      dataContainer.show();
    });

  });
});

$(document).ready(function () {
  $('form').submit(function (event) {
    event.preventDefault()
  })

  fillSelectWithMonths()
})

$(document).ready(function () {
  fillSelectWithMonths();
});