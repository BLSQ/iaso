var monthSelect = $('#monthSelect');
var regionSelect = $('#regionSelect');
var districtSelect = $('#districtSelect');
var facilitySelect = $('#facilitySelect');
var link = $('#link');

regionSelect.hide();
districtSelect.hide();
facilitySelect.hide();
link.hide();

monthSelect.on('change', function () {
  $('#period').val(this.value);
});

$.getJSON('/api/orgunits/treesearch/?parent_id=2247722&validation_status=VALID&ignoreEmptyNames=true', function (data) {

  fillSelect('#regionSelect', data);
  regionSelect.show();
});

regionSelect.on('change', function () {
  console.log("regionSelect");
  districtSelect.hide();
  facilitySelect.hide();
  link.hide();
  $.getJSON('/api/orgunits/treesearch/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    fillSelect('#districtSelect', data);
    districtSelect.show();

  });
});

districtSelect.on('change', function () {
  facilitySelect.hide();
  console.log("districtSelect");
  link.hide();
  $.getJSON('/api/orgunits/treesearch/?&parent_id=' + this.value + '&validation_status=VALID&ignoreEmptyNames=true', function (data) {
    console.log(data);
    fillSelect('#facilitySelect', data);
    facilitySelect.show();

  });
});

facilitySelect.on('change', function () {
    console.log("facilitySelect");
  $('#org_unit_id').val(this.value);
  link.show();
});

function generateTable(data) {
  var table = $('<table></table>'); // Create the table element

  // Create table header row
  var headerRow = $('<tr></tr>');
  for (var key in data[0]) { // Assuming all objects have the same keys
    headerRow.append($('<th></th>').text(key));
  }
  table.append(headerRow);

  // Create table data rows
  $(data).each(function(index, obj) {
    var row = $('<tr></tr>');
    for (var key in obj) {
      row.append($('<td></td>').text(obj[key]));
    }
    table.append(row);
  });

  return table;
}

// Example usage:
var jsonData = [
  { "name": "John Doe", "age": 30, "city": "New York" },
  { "name": "Jane Doe", "age": 25, "city": "Los Angeles" },
  { "name": "Peter Jones", "age": 40, "city": "Chicago" }
];

var table = generateTable(jsonData);
$('#table-container').append(table); // Append the table to a container element

$(document).ready(function () {
  $('form').submit(function (event) {
    event.preventDefault();

    var formData = new FormData(this);

    submitForm(formData);
  });

  fillSelectWithMonths();
});