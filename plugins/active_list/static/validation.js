var monthSelect = $('#monthSelect');
var regionSelect = $('#regionSelect');
var districtSelect = $('#districtSelect');

var districtSelectBox = $('#districtSelectBox');
var dataContainer = $('#dataContainer');
regionSelect.hide();
districtSelectBox.hide();
dataContainer.hide();
monthSelect.on('change', function () {
  $('#period').val(this.value);
});

$.getJSON('/api/orgunits/tree/?parent_id=2247722&validation_status=VALID&ignoreEmptyNames=true', function (data) {

  fillSelect('#regionSelect', data);
  regionSelect.show();
});

regionSelect.on('change', function () {
  districtSelectBox.hide();

  $.getJSON('/api/orgunits/tree/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    fillSelect('#districtSelect', data);

    districtSelectBox.show();
    dataContainer.hide();
  });
});

districtSelect.on('change', function () {
  $.getJSON('/api/orgunits/tree/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    var orgUnitId = districtSelect.val();
    var period = monthSelect.val();
    console.log(orgUnitId, period);
    $.getJSON('/active_list/validation_api/' + orgUnitId + '/' + period, function (data) {
      var table = generateTable(data.table_content);
      $("#completeness").text(data.completeness);
      $('#table-container').html(table);
      dataContainer.show();
    });

  });
});


$(document).ready(function () {
  fillSelectWithMonths();
});