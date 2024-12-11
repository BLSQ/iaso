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

$.getJSON('/api/orgunits/tree/?validation_status=VALID&ignoreEmptyNames=true', function (data) {

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
      console.log(data);
      data.table_content.forEach(item => {
        console.log(item);
        const importId = item.import_id;
        if (importId != null)
          item.import_id = `<a href="${importId}" class="validate_link">Validate</a>`;
        console.log(item);
      });
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

$(document).ready(function() {
  // Open the popup
  $("#container").on("click", ".validate_link", function(event) {
    event.preventDefault();
    $("#validation_form").show();
    $(".overlay").show();
  });

  // Close the popup
  $("#closePopup").click(function() {
    $("#validation_form").hide();
    $(".overlay").hide();
  });

  // Close the popup when clicking on the overlay
  $(".overlay").click(function() {
    $("#validation_form").hide();
    $(".overlay").hide();
  });
});