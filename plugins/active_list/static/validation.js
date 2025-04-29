var monthSelect = $('#monthSelect');

const orgUnitContainer = document.getElementById('orgUnitContainer')

var dataContainer = $('#dataContainer');

dataContainer.hide();

var orgUnitIdSave = null;

var callback = function (orgUnitId) {
  orgUnitIdSave = orgUnitId;
    var period = $('#monthSelect').val();
    $.getJSON('/active_list/validation_api/' + orgUnitId + '/' + period, function (data) {

      data.table_content.forEach(item => {
        console.log(item);
        const importId = item.import_id;
        if (importId != null)
          item.import_id = `<a href="${importId}" class="validate_link">Valider</a>`;
        console.log(item);
      });
      var table = generateTable(data.table_content);
      $("#completeness").text(data.completeness);
      $('#table-container').html(table);
       $("#generatedTable").tablesorter();
      dataContainer.show();
    });

  }

monthSelect.on('change', function () {
  $('#period').val(this.value);
  callback(orgUnitIdSave);
});


  const config = {
    targetOrgUnitTypeId: 349,
    callback: callback,
    orgUnitContainer: orgUnitContainer
  }

  addOrgUnitSelect(config, 0) // Start by adding the first level (e.g., country)
$(document).ready(function () {
  fillSelectWithMonths();
});

$(document).ready(function() {
  // Open the popup
  $("#container").on("click", ".validate_link", function(event) {
    event.preventDefault();
    var importId = $(this).attr("href");
    $("#id_source_import").val(importId);
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