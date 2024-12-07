function fillSelect (select, data) {
  $(select).empty()
  $(select).append('<option disabled selected value> -- Choisissez -- </option>')
  $(data.orgunits).each(function () {
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
      window.location.href = '/'
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
        alert(response['message'])
      }
    }
  })
}

function generateMonthList () {
  const months = []
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  for (let i = -6; i <= 1; i++) {
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
  selectBox.value = months[5]
  $('#period').val(months[5])
}