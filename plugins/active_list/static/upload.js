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



$(document).ready(function () {
  $('form').submit(function (event) {
    event.preventDefault();

    var formData = new FormData(this);

    submitForm(formData);
  });



  fillSelectWithMonths();
});